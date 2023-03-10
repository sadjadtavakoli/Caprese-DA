package TARMAQ.dataStructures.database;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import TARMAQ.dataStructures.Item;
import TARMAQ.dataStructures.Itemset;
import TARMAQ.dataStructures.Sequence;
import TARMAQ.dataStructures.creators.AbstractionCreator;
import TARMAQ.dataStructures.creators.ItemAbstractionPairCreator;
import TARMAQ.idlists.IDList;
import TARMAQ.idlists.creators.IdListCreator;
import TARMAQ.tries.Trie;
import TARMAQ.tries.TrieNode;

/**
 * Inspired in Implementation of a sequence database. Each sequence should have
 * a unique id. See examples in /test/ directory for the format of input files.
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
public class SequenceDatabase {

    private AbstractionCreator abstractionCreator;
    private IdListCreator idListCreator;
    private Map<Item, TrieNode> frequentItems = new HashMap<>();
    private List<Sequence> sequences = new ArrayList<>();
    private ItemFactory<String> itemFactory = new ItemFactory<>();
    private List<String> itemConstraintStrings;
    private List<TrieNode> itemConstraints = new ArrayList<>();
    private List<Map<String, Object>> rules = new ArrayList<>();
    private int nSequences = 1;
    /**
     * Map where we keep the original length for all the sequences
     */
    private Map<Integer, Integer> sequencesLengths = new HashMap<>();
    /**
     * Map where, for each sequence, we have a list of integers corresponding to all
     * the sizes of all the itemsets that the sequence has
     */
    private Map<Integer, List<Integer>> sequenceItemsetSize = new HashMap<>();
    /**
     * For each item, we match it with a map of entries <sequence id, number of
     * elements after item>. We will use this map in order to maintain the values
     * necessaries for making the pruning methods.
     */
    private Map<Item, Map<Integer, List<Integer>>> projectingDistance = new HashMap<>();

    /**
     * Standard constructor
     * 
     * @param abstractionCreator
     * @param IdListCreator
     */
    public SequenceDatabase(AbstractionCreator abstractionCreator, IdListCreator IdListCreator,
            List<String> itemConstraintStrings) {
        this.abstractionCreator = abstractionCreator;
        this.idListCreator = IdListCreator;
        this.itemConstraintStrings = itemConstraintStrings;
    }

    /**
     * Method that load a database from a path file given as parameter
     *
     * @param path       Path file where the database is
     * @param minSupport Minimum absolute support
     * @throws IOException
     */
    public void loadFile(String path) throws IOException {
        String thisLine;
        BufferedReader myInput = null;
        try (FileInputStream fin = new FileInputStream(new File(path))) {
            myInput = new BufferedReader(new InputStreamReader(fin));
            // For each line
            int maxLength = 0;
            while ((thisLine = myInput.readLine()) != null) {
                // If the line is not a comment line
                if (thisLine.charAt(0) != '#' && thisLine.charAt(0) != '%' && thisLine.charAt(0) != '@') {
                    // we filter sequences, compute their intersections with the itemConstrains,
                    // compute the association rules and then add them to database.
                    maxLength = addSequence(thisLine.split(" "), maxLength);
                }
            }
            Set<Item> frequentItemsSet = frequentItems.keySet();
            for (Item frequentItem : frequentItemsSet) {
                // From the item set of frequent items
                TrieNode nodo = frequentItems.get(frequentItem);
                frequentItem.setQuantity(nodo.getChild().getIdList().getSupport());

                // @TODO
                nodo.getChild().getIdList().setAppearingIn(nodo.getChild());
            }
            /*
             * We initialize all the maps
             */
            idListCreator.initializeMaps(frequentItems, projectingDistance, sequencesLengths,
                    sequenceItemsetSize/* , itemsetTimestampMatching */);
        } catch (Exception e) {
            System.out.println(e.getMessage());
        } finally {
            if (myInput != null) {
                myInput.close();
            }
        }

    }

    /**
     * Method that adds a sequence from a array of string
     *
     * @param functions
     */
    public int addSequence(String[] functions, int maxLength) { // TODO must be two or three different functions. #refactor

        // sequence filtering
        List<String> itemConstraintCopy = new ArrayList<>(itemConstraintStrings);
        List<Item> intersections = new ArrayList<>();
        itemConstraintCopy.retainAll(Arrays.asList(functions));
        if (itemConstraintCopy.size() < maxLength) { // keeps the maxlength of intresections to eliminates sequences with intersection less than this number 
            System.out.println(maxLength);
            System.out.println(itemConstraintCopy.size());
            System.out.println(" - - - - ");
            return maxLength;
        }
        if (itemConstraintCopy.size() > maxLength) {
            maxLength = itemConstraintCopy.size();
            this.reset();
        }
        for (int i = 0; i < itemConstraintCopy.size(); i++) {
            Item item = itemFactory.getItem(itemConstraintCopy.get(i));
            intersections.add(item);
        }

        ItemAbstractionPairCreator pairCreator = ItemAbstractionPairCreator.getInstance();
        long timestamp = -1;
        Sequence sequence = new Sequence(sequences.size());
        Itemset itemset = new Itemset();
        sequence.setID(nSequences);
        List<Integer> sizeItemsetsList = new ArrayList<>();

        for (int i = 0; i < functions.length; i++) {
            if (functions[i].codePointAt(0) == '<') { // Timestamp
                String value = functions[i].substring(1, functions[i].length() - 1);
                timestamp = Long.parseLong(value);
                itemset.setTimestamp(timestamp);
            } else if (functions[i].equals("-1")) { // End of an Itemset
                timestamp = itemset.getTimestamp() + 1;
                sequence.addItemset(itemset);
                sizeItemsetsList.add(sequence.length());
                sequences.add(sequence);
                nSequences++;
                sequencesLengths.put(sequence.getId(), sequence.length());
                sequenceItemsetSize.put(sequence.getId(), sizeItemsetsList);
            } else { // an item with the format : id(value) ou: id
                int indexParentheseGauche = functions[i].indexOf("(");
                if (indexParentheseGauche == -1) {
                    Item item = itemFactory.getItem(functions[i]);

                    // mine rules
                    if (!intersections.isEmpty() && !itemConstraintStrings.contains(functions[i])) {
                        Map<String, Object> rule = new HashMap<>();
                        rule.put("antecedent", intersections);
                        rule.put("consequent", item);
                        if (!rules.contains(rule))
                            rules.add(rule);
                    }
                    TrieNode node = frequentItems.get(item);
                    if (node == null) {
                        IDList idlist = idListCreator.create();
                        node = new TrieNode(
                                pairCreator.getItemAbstractionPair(item, abstractionCreator.createDefaultAbstraction()),
                                new Trie(null, idlist));
                        frequentItems.put(item, node);
                        if (itemConstraintStrings.contains(functions[i])) {
                            itemConstraints.add(node);
                        }
                    }
                    IDList idlist = node.getChild().getIdList();
                    if (timestamp < 0) {
                        timestamp = 1;
                        itemset.setTimestamp(timestamp);
                    }
                    itemset.addItem(item);

                    idListCreator.addAppearance(idlist, sequence.getId(), (int) timestamp,
                            sequence.length() + itemset.size());
                    idListCreator.updateProjectionDistance(projectingDistance, item, sequence.getId(), sequence.size(),
                            sequence.length() + itemset.size());
                }
            }
        }
        return maxLength;
    }

    public void addSequence(Sequence sequence) {
        sequences.add(sequence);
    }

    /**
     * Get the string representation of this SequenceDatabase
     * 
     * @return the string representation
     */
    @Override
    public String toString() {
        StringBuilder r = new StringBuilder();
        for (Sequence sequence : sequences) {
            r.append(sequence.getId());
            r.append(":  ");
            r.append(sequence.toString());
            r.append('\n');
        }
        return r.toString();
    }

    public int size() {
        return sequences.size();
    }

    public List<Sequence> getSequences() {
        return sequences;
    }

    /**
     * Get the equivalence classes associated with the frequent items that we have
     * found.
     * 
     * @return the trie
     */
    public List<TrieNode> itemConstraints() {
        return itemConstraints;
    }

    /**
     * Get the equivalence classes associated with the frequent items that we have
     * found.
     * 
     * @return the trie
     */
    public Trie frequentItems() {
        Trie result = new Trie();
        List<TrieNode> frequentItemsNodes = new ArrayList<>(frequentItems.values());
        result.setNodes(frequentItemsNodes);
        result.sort();
        return result;
    }

    public List<Map<String, Object>> getRules() {
        return this.rules;
    }

    public void setRules(List<Map<String, Object>> rules) {
        this.rules = rules;
    }

    public String getStrinfiedRules() {
        StringBuilder r = new StringBuilder();
        r.append("[");
        for (Map<String, Object> rule : rules) {
            r.append("{\"rule\":\"");
            r.append(rule.get("antecedent"));
            r.append(" => ");
            r.append(rule.get("consequent"));
            r.append("\"");
            r.append(", \"support\":");
            r.append(rule.get("support"));
            r.append(", \"confidence\":");
            r.append(rule.get("confidence"));
            r.append("},");
        }
        if(r.length()>1)
            r.deleteCharAt(r.length() - 1);
        r.append("]");
        return r.toString();
    }

    /**
     * Get the map that makes the matching between items and equivalence classes
     * 
     * @return the map
     */
    public Map<Item, TrieNode> getFrequentItems() {
        return frequentItems;
    }

    public void clear() {
        if (sequences != null) {
            sequences.clear();
        }
        sequences = null;
        if (frequentItems != null) {
            frequentItems.clear();
        }
        frequentItems = null;
        itemFactory = null;
        itemConstraintStrings = null;
        projectingDistance = null;
        sequenceItemsetSize = null;
        sequencesLengths = null;
    }

    public void reset() {
        frequentItems.clear();
        frequentItems = new HashMap<>();
        sequences.clear();
        sequences = new ArrayList<>();
        itemFactory = new ItemFactory<>();
        itemConstraints = new ArrayList<>();
        this.nSequences = 1;
        rules = new ArrayList<>();
    }
}
