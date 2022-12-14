package patterndetection;

import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Map.Entry;

import patterndetection.dataStructures.ImpactInformation;
import patterndetection.dataStructures.abstracciones.ItemAbstractionPair;
import patterndetection.dataStructures.creators.AbstractionCreator;
import patterndetection.dataStructures.creators.AbstractionCreator_Qualitative;
import patterndetection.dataStructures.creators.ItemAbstractionPairCreator;
import patterndetection.dataStructures.patterns.Pattern;
import patterndetection.idlists.IDList;
import patterndetection.idlists.creators.IdListCreatorStandard_Map;
import patterndetection.savers.Saver;
import patterndetection.tries.Trie;
import patterndetection.tries.TrieNode;

/**
 * This is an implementation of the main method of ClaSP algorithm. We can use
 * different kind of IdList although we only makes a implementation:
 * IDListStandard_Mapkeep. However, if we make another new IdList implementing
 * the IDList interface, we can define another different.
 *
 * NOTE: This implementation saves the pattern to a file as soon as they are
 * found or can keep the pattern into memory, depending on what the user choose.
 *
 * Copyright Antonio Gomariz Peñalver 2013
 *
 * This file is part of the SPMF DATA MINING SOFTWARE
 * (http://www.philippe-fournier-viger.com/spmf).
 *
 * SPMF is free software: you can redistribute it and/or modify it under the
 * terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * SPMF is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * If not, see <http://www.gnu.org/licenses/>.
 *
 * @author agomariz
 */
public class FrequentPatternEnumeration {

    /**
     * The abstraction creator.
     */
    private AbstractionCreator abstractionCreator;
    /**
     * The absolute minimum confidence threshold, i.e. the minimum number of
     * sequences
     * where the patterns have to be
     */
    private double minimumConfidence;

    /**
     * The absolute minimum confidence threshold, i.e. the minimum number of
     * sequences
     * where the patterns have to be, to be considered as detected
     */
    private double enoughConfidence;
    /**
     * Map in which we store the different patterns in order to know which ones can
     * be skipped because can be summarized by other ones (the closed patterns)
     */
    private Map<Integer, Map<Integer, List<Entry<Pattern, Trie>>>> matchingMap;
    /**
     * Saver variable to decide where the user want to save the results, if it the
     * case
     */
    private Saver saver;

    private Map<String, Set<String>> coocMap;
    private Map<String, TrieNode> itemConstraints;
    private Map<String, ImpactInformation> detectedFunctions;

    /**
     * Standard constructor
     *
     * @param abstractionCreator the abstraction creator
     * @param minimumConfidence  The minimum confidence
     * @param saver              The saver for correctly save the results where the
     *                           user wants
     * @param findClosedPatterns flag to indicate if we are interesting in only
     *                           finding the closed sequences
     */
    public FrequentPatternEnumeration(AbstractionCreator abstractionCreator, double minimumConfidence,
            double enoughConfidence,
            Saver saver, Map<String, TrieNode> itemConstraints, Map<String, Set<String>> coocMap) {
        this.abstractionCreator = abstractionCreator;
        this.minimumConfidence = minimumConfidence;
        this.enoughConfidence = enoughConfidence;
        this.saver = saver;
        this.matchingMap = new HashMap<>();
        this.detectedFunctions = new HashMap<>();
        this.itemConstraints = itemConstraints;
        this.coocMap = coocMap;
    }

    /**
     * 
     * Execution of the search of frequent patterns.
     * 
     * @param patron
     * @param trie
     * @param verbose
     */

    public void dfsPruning(Trie trie) {
        int tam = trie.levelSize();

        List<TrieNode> firstSequenceExtensions = trie.getNodes();
        List<Integer> itemConstraintsExtension = new ArrayList<>();
        List<Integer> regularFunctionsExtension = new ArrayList<>();

        // The algorithm finds the intersection of extensions and item constrains and
        // regular functions
        for (int i = 0; i < firstSequenceExtensions.size(); i++) {
            String nodeID = (String) firstSequenceExtensions.get(i).getPair().getItem().getId();
            if (itemConstraints.containsKey(nodeID)) {
                itemConstraintsExtension.add(i);
            } else {
                regularFunctionsExtension.add(i);
            }
        }

        // For each frequent item (the children of the root Trie)
        for (int i = 0; i < tam; i++) {
            TrieNode eq = trie.getNode(i);
            String eqID = (String) eq.getPair().getItem().getId();

            /*
             * If node is already detected with a confidence greather than the given
             * enoughConfidence,
             * the algorithm skips it and continues the iteration with the next node.
             */
            if (detectedFunctions.getOrDefault(eqID, ImpactInformation.nullObject())
                    .getConfidence() >= enoughConfidence) {
                continue;
            }

            // The algorithm updates pattern's intersection with item constraints or regular
            // functions
            List<TrieNode> patternIntersection = new ArrayList<>();
            List<String> patternRegularFunctions = new ArrayList<>();
            if (itemConstraints.containsKey(eqID)) {
                patternIntersection.add(eq);
            } else {
                patternRegularFunctions.add(eqID);
            }

            /*
             * The algorithm calls exploreChildren to produce new patterns and find the
             * impacted function.
             * This function gets a pattern of length one and the extension nodes after the
             * current item to create new patterns.
             */
            exploreChildren(new Pattern(eq.getPair()), eq, firstSequenceExtensions, i + 1,
                    patternIntersection, patternRegularFunctions,
                    itemConstraintsExtension, regularFunctionsExtension);
        }

        for (Entry<String, ImpactInformation> impactedFunction : detectedFunctions.entrySet()) {
            if (impactedFunction.getValue().getConfidence() >= minimumConfidence) { // @TODO do we really need that?
                saver.saveImpactedFunctions(impactedFunction);
            }
        }
    }

    private void exploreChildren(Pattern pattern, TrieNode currentNode, List<TrieNode> extensions,
            int beginning, List<TrieNode> patternIntersection, List<String> patternRegularFunctions,
            List<Integer> extensionsIntersection,
            List<Integer> extensionsRegularFunctions) {

        Trie currentTrie = currentNode.getChild();

        /*
         * The algorithm checks if the given pattern can be skipped using prune methods
         * backward
         * subpattern or backward superpattern of the patterns that have been extended
         * so far.
         */
        if (isAvoidable(pattern, currentTrie)) {
            return;
        }

        // Initialization of new sets
        List<Pattern> newPatterns = new ArrayList<>();
        List<TrieNode> newNodesToExtends = new ArrayList<>();
        List<Integer> newExtensionIntersection = new ArrayList<>();
        List<Integer> newExtensionRegularFunctions = new ArrayList<>();

        // The index of the last item constraint's index in the extension nodes
        Integer lastExtensionIntersection = extensionsIntersection.isEmpty() ? -1
                : extensionsIntersection.get(extensionsIntersection.size() - 1);

        // This value indicates that whether there any item constraints in the extension
        // nodes or not
        boolean notAnyItemConstraintsToExend = lastExtensionIntersection < beginning;

        // The index of the last regular function's index in the extension nodes
        Integer lastExtensionRegularFunction = extensionsRegularFunctions.isEmpty() ? -1
                : extensionsRegularFunctions.get(extensionsRegularFunctions.size() - 1);

        List<TrieNode> newExtensions = new ArrayList<>();

        // Clone for the current pattern
        Pattern clone = pattern.clonePatron();

        /*
         * From the beginning index to the last equivalence class appearing in the
         * extension set
         */
        for (int k = beginning; k < extensions.size(); k++) {
            TrieNode extensionNode = extensions.get(k);
            String extensionNodeID = (String) extensionNode.getPair().getItem().getId();

            // This value indicates that the extension node is in the given ChangeSet
            boolean extensionNodeInItemConstraints = this.itemConstraints
                    .containsKey(extensionNode.getPair().getItem().getId());

            /*
             * The algorithm checks whether the extension node is ever observed after the
             * last function of the pattern or not. If not so, the algorithm continues the
             * extension with the next node.
             * The algorithm also checks whether or not the extension node is already
             * detected with
             * the confidence more than the given enough confidence. If so, the algorithm
             * skips it.
             */
            if (this.coocMap != null) {
                String lastAppendedID = (String) clone.getIthElement(clone.size() - 1).getItem().getId();
                Set<String> map = this.coocMap.get(lastAppendedID);
                if (map != null && !map.contains(extensionNodeID) || (!extensionNodeInItemConstraints
                        && detectedFunctions.getOrDefault(extensionNodeID, ImpactInformation.nullObject())
                                .getConfidence() >= enoughConfidence)) {
                    continue;
                }
            }

            // The algorithm creates a new pattern with the elements of the current pattern
            Pattern extension = new Pattern(new ArrayList<>(clone.getElements()));

            // Then it extends it with the current extension node
            ItemAbstractionPair newPair = ItemAbstractionPairCreator.getInstance().getItemAbstractionPair(
                    extensionNode.getPair().getItem(),
                    AbstractionCreator_Qualitative.getInstance().crearAbstraccion(true));
            extension.add(newPair);

            /*
             * Then, it computes the new pattern's intersection with item constraints based
             * on the
             * base pattern's intersection and the extension node
             */
            List<TrieNode> newPatternIntersection = patternIntersection;
            if (extensionNodeInItemConstraints) {
                newPatternIntersection = new ArrayList<>(patternIntersection);
                newPatternIntersection.add(itemConstraints.get(extensionNodeID));
            }

            IDList newIdList = currentTrie.getIdList().join(extensionNode.getChild().getIdList());

            // It gets the intersections' idList in order to find their cooccurrence support
            IDList intersectionIdList = IdListCreatorStandard_Map.nodesToIDList(newPatternIntersection);

            /*
             * Based on the computed intersection, the algorithm computes the new pattern's
             * confidence by
             * dividing the new pattern's support and the intersection's.
             */
            double newPatternScore = intersectionIdList.getSupport() > 0
                    ? (double) newIdList.getSupport() / intersectionIdList.getSupport()
                    : -1;

            // The algorthm creates a new trie for it
            Trie newTrie = new Trie(null, newIdList);
            // And then inserts it its appearances
            newIdList.setAppearingIn(newTrie);
            // Next it puts in a TrieNode the new pair and the new Trie created
            TrieNode newTrieNode = new TrieNode(newPair, newTrie);

            /*
             * If the new pattern's confidence is greater than the given minimumConfidence
             * we update extension node's and the undetected functions included in that
             * pattern's
             * information.
             */
            if (newPatternScore >= minimumConfidence) {
                if (!extensionNodeInItemConstraints) {
                    /*
                     * Since the extension node is not in the given changeSet, the new pattern's
                     * score is definitely less than the older one.
                     * So, the algorithm only updates the extension node's confidence
                     */
                    updateDetectedFunctionsInfo(newPatternScore, newIdList.getSupport(), extensionNodeID,
                            newPatternIntersection);
                } else {
                    for (String functionID : patternRegularFunctions) {
                        updateDetectedFunctionsInfo(newPatternScore, newIdList.getSupport(), functionID,
                                newPatternIntersection);
                    }
                }
            }

            boolean patternIsExtendable = false;

            // If there is still at least one changeSet function to extend the new pattern
            if (k < lastExtensionIntersection) {
                /*
                 * And if the extension node is in item constrains or it's score is less than
                 * the given minimum confidence, the algorithm keeps the new pattern for furtuer
                 * extensions.
                 */
                if (extensionNodeInItemConstraints || newPatternScore < minimumConfidence) {
                    patternIsExtendable = true;
                }
                /*
                 * Also, suppose the extension node is the last changeSet function. In that
                 * case,
                 * the algorithm keeps the new pattern for the further extension only if
                 * its confidence exceeds the given minimum confidence.
                 */
            } else if (k == lastExtensionIntersection && newPatternScore >= minimumConfidence) {
                patternIsExtendable = true;
            }

            if (patternIsExtendable) {
                // The algorthms sets the new pattern's score as the extension node's
                // confidence.
                newTrieNode.setConfidence(newPatternScore);
                newPatterns.add(extension);
                newNodesToExtends.add(newTrieNode);
            }

            /*
             * The algorithm keeps the extension node for the next level of extension only
             * if two conditions
             * First, if its in item constraints.
             * Second, if there is at leat one changeSet function in the given extension
             * nodes, and the new pattern's
             * confidence is less the enoughConfidence.
             */
            if (extensionNodeInItemConstraints) {
                newExtensions.add(newTrieNode);
                newExtensionIntersection.add(newExtensions.size() - 1);
            } else if (!notAnyItemConstraintsToExend && newPatternScore < enoughConfidence) {
                newExtensions.add(newTrieNode);
                newExtensionRegularFunctions.add(newExtensions.size() - 1);
            }
            /*
             * If the new pattern's confidence is enough, and no more regular functions
             * remain to detect,
             * the algorithm ceases the iteration and goes to the next step.
             */
            if (k >= lastExtensionRegularFunction && newPatternScore >= enoughConfidence) {
                break;
            }
        }

        // The index of the last item constraint function existed in the extension nodes
        Integer newLastExtensionIntersection = newExtensionIntersection.isEmpty() ? -1
                : newExtensionIntersection.get(newExtensionIntersection.size() - 1);

        Integer extensionSize = newPatterns.size();

        /*
         * The algorithm iterates over the patterns kept for extension.
         */
        for (int i = 0; i < extensionSize; i++) {

            // we get the new pattern and the nodeTrie associated with it
            Pattern newPattern = newPatterns.get(i);
            TrieNode nodeToExtend = newNodesToExtends.remove(0);

            /*
             * The algorithm computes the new pattern's intersection with regular functions
             * and the
             * item constrains based on the current pattern's intersection and the extension
             * node
             */
            List<TrieNode> newPatternIntersection = patternIntersection;
            List<String> newPatternsRegularFunctions = patternRegularFunctions;

            if (itemConstraints.containsKey(nodeToExtend.getPair().getItem().getId())) {
                newPatternIntersection = new ArrayList<>(patternIntersection);
                newPatternIntersection.add(itemConstraints.get(nodeToExtend.getPair().getItem().getId()));
            } else if (nodeToExtend.getConfidence() < enoughConfidence) {
                newPatternsRegularFunctions = new ArrayList<>(patternRegularFunctions);
                newPatternsRegularFunctions.add((String) nodeToExtend.getPair().getItem().getId());
            }

            // Pattern's last function's index in the new extension nodes.
            Integer lastNodeIndex = newExtensions.indexOf(nodeToExtend);

            // The algorithm get's the new pattern's undetected regular functions
            newPatternsRegularFunctions = getUndetectedRegularFunctionsInPattern(newPatternsRegularFunctions);

            /*
             * If newPattern does not have any functions with confidence less than enough,
             * and no functions with not enough confidence remain
             * in the nex extensionNodes, the algorithm breaks the iteration and stops any
             * further extensions.
             */
            boolean noRegularFunctionToDetect = newPatternsRegularFunctions.isEmpty()
                    && !hasUndetectedRegularFunctionsExtensions(lastNodeIndex + 1, newExtensions,
                            newExtensionRegularFunctions);
            if (noRegularFunctionToDetect) {
                break;
            }

            /*
             * If newPattern does not include any item constraints functions, and also its
             * last function
             * is greater than the last item constraints, the algorithm breaks the iteration
             * and
             * stops any further extensions.
             */
            boolean noChangeSetFunctionToExtendWith = newPatternIntersection.isEmpty()
                    && lastNodeIndex > newLastExtensionIntersection;
            if (noChangeSetFunctionToExtendWith) {
                break;
            }

            /*
             * The algorithm recursively calls exploreChildren function on the new pattern
             * with extension nodes greater
             * than its last function
             */
            exploreChildren(newPattern, nodeToExtend, newExtensions, lastNodeIndex + 1, newPatternIntersection,
                    newPatternsRegularFunctions, newExtensionIntersection, newExtensionRegularFunctions);

            nodeToExtend.getChild().setIdList(null);
        }
    }

    /**
     * This function updates a function's info in the detected functions list.
     * this information include the confidence, supprt, and the changeSet functions
     * that impacted on that function.
     */
    private void updateDetectedFunctionsInfo(double newPatternScore, Integer support, String functionID,
            List<TrieNode> patternIntersection) {
        ImpactInformation preScore = detectedFunctions.getOrDefault(functionID,
                new ImpactInformation(0.0, 0, new ArrayList<>()));
        preScore.updateImpact(newPatternScore, support, patternIntersection);
        detectedFunctions.put(functionID, preScore);
    }

    /**
     * This function checks whether there is any undetected regular function
     * remained or not
     */
    private boolean hasUndetectedRegularFunctionsExtensions(Integer beginning, List<TrieNode> extensions,
            List<Integer> extensionsRegularFunctions) {
        for (int i = 0; i < extensionsRegularFunctions.size(); i++) {
            int nodeIndex = extensionsRegularFunctions.get(i);
            if (nodeIndex >= beginning && detectedFunctions
                    .getOrDefault(extensions.get(nodeIndex).getPair().getItem().getId(), ImpactInformation.nullObject())
                    .getConfidence() < enoughConfidence) {
                return true;
            }
        }
        return false;
    }

    /**
     * This function eliminates the detected regular functions and returns the rest
     */
    private List<String> getUndetectedRegularFunctionsInPattern(List<String> patternRegularFunctions) {
        for (int i = 0; i < patternRegularFunctions.size(); i++) {
            String nodeID = patternRegularFunctions.get(i);
            if (detectedFunctions.getOrDefault(nodeID, ImpactInformation.nullObject())
                    .getConfidence() >= enoughConfidence) {
                patternRegularFunctions.remove(i);
                i--;
            }
        }
        return patternRegularFunctions;
    }

    /**
     * Method that checks if the prefix given as parameter can be skipped by means
     * of prune methods backward subpattern or backward superpattern. The method
     * uses a map where the different patterns are kept in order to check both
     * pruning methods. The hash keys used can vary, and we give some aproaches by
     * the methods:
     *
     * keyStandardAndSupport()
     *
     * @param prefix Current pattern which is going to be checked
     * @param trie   Trie associated with prefix
     * @return
     */
    private boolean isAvoidable(Pattern prefix, Trie trie) {
        // We get the support of the pattern
        int support = trie.getSupport();
        // We get the IdList of the pattern
        IDList idList = trie.getIdList();
        /*
         * We get as a first key the sum of all sequences identifiers where the current
         * prefix appear
         */
        int key1 = trie.getSumIdSequences();
        int prefixSize = prefix.size();

        /*
         * Different approaches for the key2 can be used
         */
        int key2 = key2(idList, trie);

        /*
         * We make a new entry associating the current prefix with its corresponding
         * prefixTrie
         */
        Entry<Pattern, Trie> newEntry = new AbstractMap.SimpleEntry<>(prefix, trie);

        /*
         * Map where there appear all the patterns with the same key1 of the current
         * prefix, that makes a correspondence between a value given by key2 and all the
         * patterns that have it
         */
        Map<Integer, List<Entry<Pattern, Trie>>> associatedMap = matchingMap.get(key1);
        /*
         * If there is not any pattern with the same key2 value, we add the current
         * prefix as a new entry, and we also insert it in the matching map
         */
        if (associatedMap == null) {
            associatedMap = new HashMap<>();
            /*
             * Tin modifies:
             */
            List<Entry<Pattern, Trie>> entryList = new ArrayList<>();
            entryList.add(newEntry);
            associatedMap.put(key2, entryList);
            matchingMap.put(key1, associatedMap);
        } else {
            /*
             * If, conversely, there are some patterns with the same key2 value (and
             * extensively with the same key1 value) we check if we can apply backward
             * subpattern or backward superpattern pruning
             */

            // We get the list of entries
            List<Entry<Pattern, Trie>> associatedList = associatedMap.get(key2);
            // If is still empty, we create one
            if (associatedList == null) {
                associatedList = new ArrayList<>();
                associatedList.add(newEntry);
                associatedMap.put(key2, associatedList);
            } else {
                int i = 0;
                for (i = 0; i < associatedList.size(); i++) {
                    // For all the elements of the associated list
                    Entry<Pattern, Trie> storedEntry = associatedList.get(i);
                    // We get both pattern and trie from the entry
                    Pattern p = storedEntry.getKey();
                    Trie t = storedEntry.getValue();
                    // If the support of the current prefix and the p pattern are equal
                    // And if the prefix size is less than the size of p and prefix is a subpattern
                    // of p
                    if (support == t.getSupport() && prefixSize < p.size()
                            && prefix.isSubpattern(abstractionCreator, p)) {
                        /*
                         * We dfsPruning backward subpattern pruning and establish as new nodes the
                         * nodes of the trie of p
                         */
                        trie.setNodes(t.getNodes());
                        /*
                         * We end the method since we have already done the prune
                         */
                        return true;
                    }
                }
                // In this point we add the new entry of the current prefix
                associatedList.add(newEntry);
            }
        }
        /*
         * We did not find any subpattern or supperpattern in order to skip the
         * generation of the current prefix
         */
        return false;
    }

    /**
     * Method used to obtain the value for the second key of matchingMap.
     *
     * @param idlist
     * @param t
     * @return
     */
    private int key2(IDList idlist, Trie t) {
        /*
         * If you are interested in changing the method, just comment the line of below
         * and uncomment one of the others
         */
        return FrequentPatternEnumeration.keyStandardAndSupport(idlist, t);
    }

    /**
     * One of the methods used by key2 in the method isAvoidable that return the
     * addition of the number of elements that appear in the projected database and
     * the support of the related prefix
     *
     * @param idList IdList of the prefix to consider
     * @param trie   Trie of the pattern to consider
     * @return
     */
    private static int keyStandardAndSupport(IDList projection, Trie trie) {
        return projection.getTotalElementsAfterPrefixes() + trie.getSupport();
    }

    public void clear() {
        if (matchingMap != null) {
            matchingMap.clear();
            matchingMap = null;
        }
    }
}