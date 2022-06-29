package clasp_AGP;

import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Map.Entry;

import clasp_AGP.dataStructures.ImpactInformation;
import clasp_AGP.dataStructures.abstracciones.ItemAbstractionPair;
import clasp_AGP.dataStructures.creators.AbstractionCreator;
import clasp_AGP.dataStructures.creators.AbstractionCreator_Qualitative;
import clasp_AGP.dataStructures.creators.ItemAbstractionPairCreator;
import clasp_AGP.dataStructures.patterns.Pattern;
import clasp_AGP.idlists.IDList;
import clasp_AGP.idlists.creators.IdListCreatorStandard_Map;
import clasp_AGP.savers.Saver;
import clasp_AGP.tries.Trie;
import clasp_AGP.tries.TrieNode;

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
public class FrequentPatternEnumeration_ClaSP {

    public long joinCount = 0; // PFV 2013 - to count the number of intersections
    /**
     * The abstraction creator.
     */
    private AbstractionCreator abstractionCreator;
    /**
     * The absolute minimum confidence threshold, i.e. the minimum number of sequences
     * where the patterns have to be
     */
    private double minimumConfidence;

    /**
     * The absolute minimum confidence threshold, i.e. the minimum number of sequences
     * where the patterns have to be, to be considered as detected
     */
    private double enoughConfidence;
    /**
     * Number of frequent patterns found by the algorithm. Initially set to zero.
     */
    private int numberOfFrequentPatterns = 0;
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
     * Tin inserts:
     */
    protected List<TrieNode> firstSequenceExtensions;

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
    public FrequentPatternEnumeration_ClaSP(AbstractionCreator abstractionCreator, double minimumConfidence, double enoughConfidence,
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
        /*
         * Tin inserts
         */
        firstSequenceExtensions = trie.getNodes();
        List<Integer> itemConstraintsExtension = new ArrayList<>();
        List<Integer> regularFunctionsExtension = new ArrayList<>();

        for (int i = 0; i < firstSequenceExtensions.size(); i++) {
            String nodeID = (String) firstSequenceExtensions.get(i).getPair().getItem().getId();
            if (itemConstraints.containsKey(nodeID)) {
                itemConstraintsExtension.add(i);
            } else {
                regularFunctionsExtension.add(i);
            }
        }

        for (int i = 0; i < tam; i++) {
            // For each frequent item (the children of the root Trie)
            TrieNode eq = trie.getNode(i);
            String eqID = (String) eq.getPair().getItem().getId();
            
            if(detectedFunctions.getOrDefault(eqID, ImpactInformation.nullObject()).getConfidence() >= enoughConfidence){
                continue;
            }
            List<TrieNode> patternIntersection = new ArrayList<>();
            List<String> patternRegularFunctions = new ArrayList<>();
            if (itemConstraints.containsKey(eqID)) {
                patternIntersection.add(eq);
            } else {
                patternRegularFunctions.add(eqID);
            }
            /*
             * We call to the main method of the algorithm for that Trie associated with the
             * frequent item
             */
            exploreChildren(new Pattern(eq.getPair()), eq, firstSequenceExtensions, i + 1,
                    patternIntersection, patternRegularFunctions,
                    itemConstraintsExtension, regularFunctionsExtension);
        }
    }

    private void exploreChildren(Pattern pattern, TrieNode currentNode, List<TrieNode> extensions,
            int beginning, List<TrieNode> patternIntersection, List<String> patternRegularFunctions,
            List<Integer> extensionsIntersection,
            List<Integer> extensionsRegularFunctions) {

        Trie currentTrie = currentNode.getChild();

        if (isAvoidable(pattern, currentTrie)) {
            return;
        }

        numberOfFrequentPatterns++;

        // Initialization of new sets
        List<Pattern> newPatterns = new ArrayList<>();
        List<TrieNode> newNodesToExtends = new ArrayList<>();
        List<Integer> newExtensionIntersection = new ArrayList<>();
        List<Integer> newExtensionRegularFunctions = new ArrayList<>();

        Integer lastExtensionIntersection = extensionsIntersection.isEmpty() ? -1 : extensionsIntersection.get(extensionsIntersection.size() - 1);
        boolean notAnyItemConstraintsToExend = lastExtensionIntersection < beginning;
        Integer lastExtensionRegularFunction = extensionsRegularFunctions.isEmpty() ? -1 : extensionsRegularFunctions.get(extensionsRegularFunctions.size() - 1);

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
            boolean extensionNodeInItemConstraints = this.itemConstraints
                    .containsKey(extensionNode.getPair().getItem().getId());
            if (this.coocMap != null) {
                String lastAppendedID = (String) clone.getIthElement(clone.size() - 1).getItem().getId();
                Set<String> map = this.coocMap.get(lastAppendedID);
                if (map != null && !map.contains(extensionNodeID) || (!extensionNodeInItemConstraints && detectedFunctions.getOrDefault(extensionNodeID, ImpactInformation.nullObject()).getConfidence() >= enoughConfidence)) {
                    continue;
                }
            }

            // We create a new pattern with the elements of the current pattern
            Pattern extension = new Pattern(new ArrayList<>(clone.getElements()));
            // And we add it the current item of extension set
            ItemAbstractionPair newPair = ItemAbstractionPairCreator.getInstance().getItemAbstractionPair(
                    extensionNode.getPair().getItem(),
                    AbstractionCreator_Qualitative.getInstance().crearAbstraccion(true));
            extension.add(newPair);

            /*
             * We make the join operation between the tries of both patterns in order to
             * know the appearances of the new pattern and its support.
             */
            joinCount++;
            List<TrieNode> newPatternIntersection = patternIntersection;
            if (extensionNodeInItemConstraints) {
                newPatternIntersection = new ArrayList<>(patternIntersection);
                newPatternIntersection.add(itemConstraints.get(extensionNodeID));
            }

            IDList newIdList = currentTrie.getIdList().join(extensionNode.getChild().getIdList());
            IDList intersectionIdList = IdListCreatorStandard_Map.nodesToIDList(newPatternIntersection);

            double newPatternScore = intersectionIdList.getSupport()>0 ? (double) newIdList.getSupport() / intersectionIdList.getSupport() : -1;
            Trie newTrie = new Trie(null, newIdList);
            // And we insert it its appearances
            newIdList.setAppearingIn(newTrie);
            // we put in a TrieNode the new pair and the new Trie created
            TrieNode newTrieNode = new TrieNode(newPair, newTrie);
            // And we merge the new Trie with the current one
            newTrieNode.setConfidence(newPatternScore);

            if((k>=lastExtensionIntersection && newPatternScore >= minimumConfidence)||k<lastExtensionIntersection){
                if(!extensionNodeInItemConstraints){
                    updateDetectedFunctionsInfo(newPatternScore, newIdList.getSupport(), extensionNodeID, newPatternIntersection);
                }else{
                    for(String functionID: patternRegularFunctions){
                        updateDetectedFunctionsInfo(newPatternScore, newIdList.getSupport(), functionID, newPatternIntersection);
                    }
                }
            }

            boolean patternIsExtendable = false;

            if(k<lastExtensionIntersection){
                if(extensionNodeInItemConstraints || newPatternScore < minimumConfidence){
                    patternIsExtendable = true;
                }
            }else if(k==lastExtensionIntersection && newPatternScore >= minimumConfidence){
                patternIsExtendable = true;
            }

            if(patternIsExtendable){
                newPatterns.add(extension);
                newNodesToExtends.add(newTrieNode);
            }
            /*
            * Finally we add the new pattern and nodeTrie to the sets that are needed for
            * future patterns
            */
            if (extensionNodeInItemConstraints) {
                newExtensions.add(newTrieNode);
                newExtensionIntersection.add(newExtensions.size() - 1);
            } else if (!notAnyItemConstraintsToExend && newPatternScore < enoughConfidence) {
                newExtensions.add(newTrieNode);
                newExtensionRegularFunctions.add(newExtensions.size() - 1);
            }

            if(k>=lastExtensionRegularFunction && newPatternScore>=enoughConfidence){
                break;
            }
        }
        Integer extensionSize = newPatterns.size();

        Integer newLastExtensionIntersection = newExtensionIntersection.isEmpty() ? -1 : newExtensionIntersection.get(newExtensionIntersection.size() - 1);
        // For all the elements valuables as future i-extensions
        for (int i = 0; i < extensionSize; i++) {
            // we get the new pattern and the nodeTrie associated with it
            Pattern newPattern = newPatterns.get(i);
            TrieNode nodeToExtend = newNodesToExtends.remove(0);

            /*
             * And we make a recursive call to dfs_pruning with the new extension.
             * Besides we establish the same set as the set which we will make the
             * i-extensions, but beginning from the (i+1)-th element
             */
            List<TrieNode> newPatternIntersection = patternIntersection;
            List<String> newPatternsRegularFunctions = patternRegularFunctions; 
            Integer lastNodeIndex = newExtensions.indexOf(nodeToExtend);

            if(itemConstraints.containsKey(nodeToExtend.getPair().getItem().getId())) {
                newPatternIntersection = new ArrayList<>(patternIntersection);
                newPatternIntersection.add(itemConstraints.get(nodeToExtend.getPair().getItem().getId()));
            } else if(nodeToExtend.getConfidence()<enoughConfidence){
                newPatternsRegularFunctions = new ArrayList<>(patternRegularFunctions);
                newPatternsRegularFunctions.add((String) nodeToExtend.getPair().getItem().getId());
            }
            newPatternsRegularFunctions = getUndetectedRegularFunctionsInPattern(newPatternsRegularFunctions);
            boolean noRegularFunctionToDetect = newPatternsRegularFunctions.isEmpty() && !hasUndetectedRegularFunctionsExtensions(lastNodeIndex + 1, newExtensions, newExtensionRegularFunctions);
            if(noRegularFunctionToDetect){
                break;
            }

            boolean noChangeSetFunctionToExtendWith = newPatternIntersection.isEmpty() && lastNodeIndex > newLastExtensionIntersection;
            if (noChangeSetFunctionToExtendWith) { 
                break;
            }


            exploreChildren(newPattern, nodeToExtend, newExtensions, lastNodeIndex + 1, newPatternIntersection,
            newPatternsRegularFunctions, newExtensionIntersection, newExtensionRegularFunctions);
            
            nodeToExtend.getChild().setIdList(null);
        }
    }

    private void updateDetectedFunctionsInfo(double newPatternScore, Integer support, String functionID, List<TrieNode> patternIntersection) {
        ImpactInformation preScore = detectedFunctions.getOrDefault(functionID, new ImpactInformation(0.0, 0, new ArrayList<>()));
        preScore.updateImpact(newPatternScore, support, patternIntersection);
        detectedFunctions.put(functionID, preScore);
    }

    private boolean hasUndetectedRegularFunctionsExtensions(Integer beginning, List<TrieNode> extensions, List<Integer> extensionsRegularFunctions){
        for(int i=0; i<extensionsRegularFunctions.size(); i++){
            int nodeIndex = extensionsRegularFunctions.get(i);
            if(nodeIndex>=beginning && detectedFunctions.getOrDefault(extensions.get(nodeIndex).getPair().getItem().getId(), ImpactInformation.nullObject()).getConfidence() < enoughConfidence) {
                return true;
            }
        }
        return false;
    }

    private List<String> getUndetectedRegularFunctionsInPattern(List<String> patternRegularFunctions){
        for(int i=0; i<patternRegularFunctions.size(); i++){
            String nodeID = patternRegularFunctions.get(i);
            if (detectedFunctions.getOrDefault(nodeID, ImpactInformation.nullObject()).getConfidence() >= enoughConfidence) {
                patternRegularFunctions.remove(i);
                i--;
            } 
        }
        return patternRegularFunctions;
    }

    /**
     * It returns the number of frequent patterns found by the last execution of the
     * algorithm.
     *
     * @return
     */
    public int getFrequentPatterns() {
        return numberOfFrequentPatterns;
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
                int superPattern = 0;
                for (i = 0; i < associatedList.size(); i++) {
                    // For all the elements of the associated list
                    Entry<Pattern, Trie> storedEntry = associatedList.get(i);
                    // We get both pattern and trie from the entry
                    Pattern p = storedEntry.getKey();
                    Trie t = storedEntry.getValue();
                    // If the support of the current prefix and the p pattern are equal
                    if (support == t.getSupport()) {
                        // We keep the size of the pattern
                        int pSize = p.size();
                        if (pSize != prefixSize) {
                            // if the prefix size is less than the size of p
                            if (prefixSize < pSize) {
                                // and prefix is a subpattern of p
                                if (prefix.isSubpattern(abstractionCreator, p)) {
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
                            } else if (p.isSubpattern(abstractionCreator, prefix)) {
                                /*
                                 * if, conversely, the prefix size is greater than the size of p and prefix is a
                                 * superpattern of p
                                 */

                                // we update a counter of superpatterns
                                superPattern++;
                                /*
                                 * and we make the prefix trie point to the nodes of the trie of p
                                 */
                                trie.setNodes(t.getNodes());
                                /*
                                 * and we make null the nodes of t since p is included in prefix
                                 */
                                // And we remove the entry of the list
                                associatedList.remove(i);
                                i--;
                            }
                        }
                    }
                }
                // In this point we add the new entry of the current prefix
                associatedList.add(newEntry);
                // If we found any superPattern
                if (superPattern > 0) {
                    /*
                     * if (superPattern > 1) {
                     * System.out.println("We removed more than one pattern!!"); }
                     */
                    // We return the correspondent output
                    return true;
                }
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
        return FrequentPatternEnumeration_ClaSP.keyStandardAndSupport(idlist, t);
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

    /**
     * @return a hashmap containing the impact-set and their confidence. 
     */
    Map<String, ImpactInformation> getImpactSet() {
        return detectedFunctions;
    }

    /**
     * it removes infrequent detected functions 
     */
    void saveFrequentImpactedFunctions(){
        for(Entry<String, ImpactInformation> impactedFunction: detectedFunctions.entrySet()){
            if(impactedFunction.getValue().getConfidence() >= minimumConfidence){
                saver.saveImpactedFunctions(impactedFunction);
            }
        }
    }

    public void clear() {
        if (matchingMap != null) {
            matchingMap.clear();
            matchingMap = null;
        }
    }
}