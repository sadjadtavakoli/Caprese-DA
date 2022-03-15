package clasp_AGP.idlists;

import java.util.ArrayList;
import java.util.BitSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import clasp_AGP.dataStructures.patterns.Pattern;
import clasp_AGP.tries.Trie;

/**
 * Inspired in Implementation of a Idlist for ClaSP. This IdList is based on a
 * hash map of entries <Integer, List<Integer>>, and it makes a correspondence
 * between a sid, denoted by the Integer, with the apperances of the pattern in
 * that sequence, denoted by the list of positions. In that list we will have
 * positions with the where an appearance of the pattern can be found, and is
 * increasingly sorted in the itemset timestamps first, and the item positions
 * later.
 *
 * In order to make the join operation, we will do it entry by entry, for those
 * entries shared by two sequences. ÎÎ Copyright Antonio Gomariz Peñalver 2013
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
public class IDListStandard_Map implements IDList {

    /**
     * The map where we keep the appearances of a pattern in a sequence. With an
     * integer we stand for a sequence id, whereas a list of itemsets correspond to
     * all the itemset timestamps where the pattern occurs
     */
    private Map<Integer, List<Integer>> sequencePositionsEntries;
    /**
     * A bitset to keep just the sequences where a pattern appears. Is the bitset
     * representation of the keyset of the map sequence_ItemsetEntries
     */
    BitSet sequences;
    // Map with the original size of all sequences
    private static Map<Integer, Integer> originalSizeOfSequences = new HashMap<Integer, Integer>();
    /*
     * Value that counts the total of elements that appear after the last item
     * appearance of the pattern where this IdList is referring to
     */
    private int totalElementsAfterPrefixes = 0;

    /**
     * The standard constructor. It creates an empty IdList.
     */
    public IDListStandard_Map() {
        this.sequencePositionsEntries = new HashMap<Integer, List<Integer>>();
    }

    /**
     * It creates an IdList from a map of <Integer,List<Integer>>
     *
     * @param sequencePositionsEntries
     */
    public IDListStandard_Map(Map<Integer, List<Integer>> sequencePositionsEntries) {
        this.sequencePositionsEntries = sequencePositionsEntries;
        this.sequences = new BitSet(sequencePositionsEntries.size());
    }

    /**
     * It return the intersection IdList that results from the current object and
     * the IdList given as an argument.
     *
     * @param idList     IdList with which we join the current IdList.
     * @param equals     Flag indicating if we want a intersection for equal
     *                   relation, or, if it is false, an after relation.
     * @return the intersection
     */
    @Override
    public IDList join(IDList idList) {
        // We create the result map of entries of list of item positions
        /*
         * Tin modifies:
         */
        // get minimum of sizes of two IDList:
        int size = (((IDListStandard_Map) idList).getSequencePositionsEntries().size() > ((IDListStandard_Map) this)
                .getSequencePositionsEntries().size())
                        ? ((IDListStandard_Map) this).getSequencePositionsEntries().size()
                        : ((IDListStandard_Map) idList).getSequencePositionsEntries().size();
        Map<Integer, List<Integer>> intersection = new HashMap<Integer, List<Integer>>(size);

        // We create an empty bitset where we will keep the pattern appearances
        BitSet newSequences = new BitSet(idList.getSupport());
        // Cast in the argument IdList
        IDListStandard_Map idStandard = (IDListStandard_Map) idList;
        int[] newTotalElementsAfterPrefixes = new int[1];
        // And we get the map of entries of list of positions
        Map<Integer, List<Integer>> idListMap = idStandard.getSequencePositionsEntries();
        Set<Map.Entry<Integer, List<Integer>>> entries = idListMap.entrySet();
        // For each entry of the given IdList
        for (Map.Entry<Integer, List<Integer>> entry : entries) {
            int sid = entry.getKey();
            /*
             * We get the positions that correspond with the sequence given by the key of
             * the current entry
             */
            List<Integer> positionAppearancesInSequence = entry.getValue();
            /*
             * We create a new list of positions where we keep the result for this entry
             */
            List<Integer> positionAppearances;
            // If the flag is activated
                // We make an equal operation join for the current sequence sid
            positionAppearances = equalOperation(sid, positionAppearancesInSequence, newTotalElementsAfterPrefixes);
            // If there is any result, we keep it
            if (positionAppearances != null) {
                intersection.put(entry.getKey(), positionAppearances);
                newSequences.set(sid);
            }
        }
        // Finally, we return the new IdList and the sequence bitset associated with it
        IDListStandard_Map output = new IDListStandard_Map(intersection);
        output.sequences = newSequences;
        output.setTotalElementsAfterPrefixes(newTotalElementsAfterPrefixes[0]);
        return output;
    }

    /**
     * It gets the map that codes that appearances of the pattern in this IdList
     *
     * @return the map
     */
    public Map<Integer, List<Integer>> getSequencePositionsEntries() {
        return sequencePositionsEntries;
    }

    
    /**
     * set sequences, used just for clones
     */
    public void setSequences(BitSet sequences){
        this.sequences = sequences;
    }

    /**
     * set sequencePositionsEntries
     */
    public void setSequencePositionsEntries(Map<Integer, List<Integer>> sequencePositionsEntries){
        this.sequencePositionsEntries = sequencePositionsEntries;
    }

    /**
     * It executes a join operation under the equal relation for a two sets of
     * appearances that correspond to a same sequence in two different patterns
     *
     * @param sid                                Sequence identifier of the sequence
     *                                           where we want to check if it exists
     *                                           the pattern
     * @param positionItemsAppearancesInSequence Position items of the parameter
     *                                           Idlist
     * @param dif                                Place where we store the difference
     *                                           between the original size of the
     *                                           sequence and the elements that
     *                                           there are up to the last item
     *                                           appearance of the pattern that the
     *                                           IdList is referring to
     * @return The new Entry for the new IdList
     */
    private List<Integer> equalOperation(Integer key, List<Integer> positionItemsAppearancesInSequence, int[] dif) {
        // We get the position items for the same sequence for the current IdList
        List<Integer> positionItemsAppearancesInSequenceOfMyIdList = sequencePositionsEntries.get(key);
        // If there is not any occurrence we end the join operation
        if (positionItemsAppearancesInSequenceOfMyIdList == null
                || positionItemsAppearancesInSequenceOfMyIdList.isEmpty()) {
            return null;
        }
        // Otherwise we create a new List of position items where we keep the new
        // entries
        List<Integer> result = new ArrayList<>();
        int beginningIndex = 0;

        /*
         * We explore the smaller list and we search in the greater one
         */
        List<Integer> listToExplore, listToSearch;
        if (positionItemsAppearancesInSequenceOfMyIdList.size() <= positionItemsAppearancesInSequence.size()) {
            listToExplore = positionItemsAppearancesInSequenceOfMyIdList;
            listToSearch = positionItemsAppearancesInSequence;
        } else {
            listToExplore = positionItemsAppearancesInSequence;
            listToSearch = positionItemsAppearancesInSequenceOfMyIdList;
        }
        /*
         * Tin modifies:
         */
        boolean twoFirstEventsEqual = false;
        // For each itemset timestamp in the list to explores
        for (Integer eid : listToExplore) {
            /*
             * For each itemset timestamp from the beginning index to the end of the list to
             * search
             */
            for (int i = beginningIndex; i < listToSearch.size(); i++) {
                Integer currentPosition = listToSearch.get(i);
                // We make a comparison
                if (eid > currentPosition) {
                    result.add(eid);
                    /*
                        * Tin modifies:
                        */
                    if (!twoFirstEventsEqual)
                        dif[0] += (originalSizeOfSequences.get(key) - eid);
                    // dif[0] += (originalSizeOfSequences.get(key) - eid.getItemIndex());
                } else {
                    result.add(currentPosition);
                    if (!twoFirstEventsEqual)
                        dif[0] += (originalSizeOfSequences.get(key) - currentPosition);
                    // dif[0] += (originalSizeOfSequences.get(key) -
                    // currentPosition.getItemIndex());
                }
                twoFirstEventsEqual = true;
                beginningIndex = i + 1;
            }
        }

        if (result.isEmpty()) {
            return null;
        }
        return result;
    }

    /**
     * clones this idList to idList
     */
    public void clone(IDList idList){
        ((IDListStandard_Map) idList).setSequencePositionsEntries(this.sequencePositionsEntries);
        ((IDListStandard_Map) idList).setSequences(this.sequences);
        idList.SetOriginalSequenceLengths(originalSizeOfSequences);
        idList.setTotalElementsAfterPrefixes(this.totalElementsAfterPrefixes);
    }

    @Override
    public int getSupport() {
        return sequences.cardinality();
    }

    /**
     * It adds an appearance for the sequence and a position item given as parameter
     * in the current IdList
     *
     * @param sequence     Sequence identifier where the appearence occurs
     * @param positionItem Itemset timestamp where the appearance occurs
     */
    public void addAppearance(Integer sequence, Integer positionItem) {
        List<Integer> eids = sequencePositionsEntries.get(sequence);
        if (eids == null) {
            eids = new ArrayList<Integer>();
        }
        if (!eids.contains(positionItem)) {
            eids.add(positionItem);
            sequencePositionsEntries.put(sequence, eids);
            sequences.set(sequence);
        }
    }

    /**
     * Get a string representation of this IdList
     *
     * @return the string representation
     */
    @Override
    public String toString() {
        StringBuilder result = new StringBuilder();
        Set<Map.Entry<Integer, List<Integer>>> entries = sequencePositionsEntries.entrySet();
        for (Map.Entry<Integer, List<Integer>> entry : entries) {
            result.append("\t").append(entry.getKey()).append(" {");
            result.deleteCharAt(result.length() - 1);
            result.append("}\n");
        }
        return result.toString();
    }

    /**
     * It set in the Trie object, given as parameter, the sequence identifiers where
     * the pattern associated with the IdList appears
     * 
     * @param trie
     */
    @Override
    public void setAppearingIn(Trie trie) {
        trie.setAppearingIn((BitSet) sequences.clone());
    }

    /**
     * It clears the attributes of this IdList
     */
    @Override
    public void clear() {
        sequencePositionsEntries.clear();
        sequences.clear();
    }

    public static void sclear() {
        if (originalSizeOfSequences != null) {
            originalSizeOfSequences.clear();
            originalSizeOfSequences = null;
        }
    }

    @Override
    public Map<Integer, List<Integer>> appearingInMap() {
        return sequencePositionsEntries;
    }

    /**
     * It returns the number of elements that appears after each appearance of the
     * pattern associated with the IdList
     * 
     * @return the number of elements
     */
    @Override
    public int getTotalElementsAfterPrefixes() {
        return totalElementsAfterPrefixes;
    }

    /**
     * It sets the number of elements that appears after each appearance of the
     * pattern associated with the IdList
     * 
     * @param i the number of elements
     */
    @Override
    public void setTotalElementsAfterPrefixes(int i) {
        this.totalElementsAfterPrefixes = i;
    }

    /**
     * It sets the original lengths of the database sequences
     * 
     * @param map
     */
    @Override
    public void SetOriginalSequenceLengths(Map<Integer, Integer> map) {
        originalSizeOfSequences = map;
    }

    /**
     * It moves to a pattern the sequences where the Idlist is active.
     * 
     * @param pattern the pattern
     */
    @Override
    public void setAppearingIn(Pattern pattern) {
        pattern.setAppearingIn((BitSet) sequences.clone());
    }
}
