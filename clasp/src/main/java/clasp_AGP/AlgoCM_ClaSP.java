package clasp_AGP;

import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import clasp_AGP.dataStructures.Sequence;
import clasp_AGP.dataStructures.creators.AbstractionCreator;
import clasp_AGP.dataStructures.database.SequenceDatabase;
import clasp_AGP.dataStructures.patterns.Pattern;
import clasp_AGP.savers.Saver;
import clasp_AGP.savers.SaverIntoFile;
import clasp_AGP.savers.SaverIntoMemory;
import clasp_AGP.tries.Trie;
import clasp_AGP.tries.TrieNode;
import clasp_AGP.tools.MemoryLogger;

/**
 * This is an implementation of the ClaSP algorithm. ClaSP was proposed by A.
 * Gomariz et al. in 2013.
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
public class AlgoCM_ClaSP {

    /**
     * The absolute minimum support threshold, i.e. the minimum number of sequences
     * where the patterns have to be
     */
    protected double minimumConfidence;
    /**
     * Saver variable to decide where the user want to save the results, if it the
     * case
     */
    Saver saver = null;
    /**
     * Start and End points in order to calculate the overall time taken by the
     * algorithm
     */
    public long overallStart, overallEnd;
    /**
     * Start and End points in order to calculate the time taken by the main part of
     * CloSpan algorithm
     */
    protected long mainMethodStart, mainMethodEnd;
    /**
     * Start and End points in order to calculate the time taken by the
     * post-processing method of CloSpan algorithm
     */
    protected long postProcessingStart, postProcessingEnd;
    /**
     * Trie root that starts with the empty pattern and from which we will be able
     * to access to all the frequent patterns generated by ClaSP
     */
    protected Trie FrequentAtomsTrie;
    /**
     * The abstraction creator
     */
    private AbstractionCreator abstractionCreator;
    /**
     * Number of frequent patterns found by the algorithm
     */
    private int numberOfFrequentPatterns, numberOfFrequentClosedPatterns;
    /**
     * flag to indicate if we are interesting in only finding the closed sequences
     */
    protected List<TrieNode> itemConstraint;
    protected List<String> itemConstraintStrings;

    public long joinCount; // PFV 2013

    /**
     * Constructor of the class that calls ClaSP algorithm.
     *
     * @param minimumConfidence minimum confidence
     * @param abstractionCreator the abstraction creator
     */
    public AlgoCM_ClaSP(double minimumConfidence, AbstractionCreator abstractionCreator) {
        this.minimumConfidence = minimumConfidence;
        this.abstractionCreator = abstractionCreator;
    }

    /**
     * Actual call to ClaSP algorithm. The output can be either kept or ignore.
     * Whenever we choose to keep the patterns found, we can keep them in a file or
     * in the main memory
     *
     * @param database                  Original database in where we want to search
     *                                  for the frequent patterns.
     * @param outputFilePath            Path of the file in which we want to store
     *                                  the frequent patterns. If this value is
     *                                  null, we keep the patterns in the main
     *                                  memory. 
     * @param outputSequenceIdentifiers indicates if sequence ids should be output
     *                                  with each pattern found.
     * @throws IOException
     */
    public void runAlgorithm(SequenceDatabase database, String outputFilePath,
            boolean outputSequenceIdentifiers) throws IOException {
        // If we do no have any file path
        if (outputFilePath == null || outputFilePath.equals("-")) {
            // The user wants to save the results in memory
            saver = new SaverIntoMemory(outputSequenceIdentifiers);
        } else {
            // Otherwise, the user wants to save them in the given file
            saver = new SaverIntoFile(outputFilePath);
        }
        // reset the stats about memory usage
        MemoryLogger.getInstance().reset();
        // keeping the starting time
        overallStart = System.currentTimeMillis();
        // Starting ClaSP algorithm
        claSP(database, minimumConfidence);
        // keeping the ending time
        overallEnd = System.currentTimeMillis();
        // Search for frequent patterns: Finished
        saver.finish();
    }

    /**
     * The actual method for extracting frequent sequences.
     *
     * @param database       The original database
     * @param minimumConfidence the minimum confidence
     */
    protected void claSP(SequenceDatabase database, double minimumConfidence) {
        // We get the initial trie whose children are the frequent 1-patterns
        FrequentAtomsTrie = database.frequentItems();
        itemConstraint = database.itemConstraints();
        itemConstraintStrings = database.itemConstraintsString();

        // NEW-CODE-PFV 2013
        // Map: key: item value: another item that followed the first item + support
        // (could be replaced with a triangular matrix...)
        Map<String, Map<String, Integer>> coocMapEquals = new HashMap<String, Map<String, Integer>>(1000);

        // update COOC map
        for (Sequence seq : database.getSequences()) {
            Map<String, Set<String>> alreadySeenB_equals = new HashMap<>();
            // for each item
            for (int j = 0; j < seq.size(); j++) {
                String itemA = (String) seq.get(j).getId();
                Set<String> equalSet = alreadySeenB_equals.get(itemA);
                if (equalSet == null) {
                    equalSet = new HashSet<>();
                    alreadySeenB_equals.put(itemA, equalSet);
                }

                // create the map if not existing already
                Map<String, Integer> mapCoocItemEquals = coocMapEquals.get(itemA);

                // For each item after itemA in the same sequence // @SADJADRE It's enough to
                // count items occured after each item since the items are sorted.
                for (int k = j + 1; k < seq.size(); k++) {
                    String itemB = (String) seq.get(k).getId();
                    if (!equalSet.contains(itemB)) {
                        if (mapCoocItemEquals == null) {
                            mapCoocItemEquals = new HashMap<>();
                            coocMapEquals.put(itemA, mapCoocItemEquals);
                        }
                        Integer frequency = mapCoocItemEquals.get(itemB);

                        if (frequency == null) {
                            mapCoocItemEquals.put(itemB, 1);
                        } else {
                            mapCoocItemEquals.put(itemB, frequency + 1);
                        }

                        equalSet.add(itemB);
                    }
                }
            }
        }
        // System.out.println("************ cooc map ************");
        // System.out.println(coocMapEquals);
        database.clear();
        database = null;

        // Inizialitation of the class that is in charge of find the frequent patterns
        FrequentPatternEnumeration_ClaSP frequentPatternEnumeration = new FrequentPatternEnumeration_ClaSP(
                abstractionCreator, minimumConfidence, saver, itemConstraint, itemConstraintStrings , coocMapEquals);

        this.mainMethodStart = System.currentTimeMillis();
        // We dfsPruning the search
        frequentPatternEnumeration.dfsPruning(FrequentAtomsTrie);
        this.mainMethodEnd = System.currentTimeMillis();
        // Once we had finished, we keep the number of frequent patterns that we found
        numberOfFrequentPatterns = frequentPatternEnumeration.getFrequentPatterns();

        // check the memory usage for statistics
        MemoryLogger.getInstance().checkMemory();

        System.out.println("ClaSP: The algorithm takes " + (mainMethodEnd - mainMethodStart) / 1000
                + " seconds and finds " + numberOfFrequentPatterns + " patterns");
        // @TODO @SADJADRE should refactor this sections. This whole code is implemented
        // for seqeunce detection not just simply cooccurance probability detection
        List<Entry<Pattern, Trie>> outputPatternsFromMainMethod = FrequentAtomsTrie.preorderTraversal(null);
        // System.out.println("patterns before non-closed elimination");
        // System.out.println(outputPatternsFromMainMethod.toString());

        this.postProcessingStart = System.currentTimeMillis();
        frequentPatternEnumeration.removeNonClosedNonItemConstraintPatterns(outputPatternsFromMainMethod);
        this.postProcessingEnd = System.currentTimeMillis();
        numberOfFrequentClosedPatterns = frequentPatternEnumeration.getFrequentClosedPatterns();
        System.out.println("ClaSP:The post-processing algorithm to remove the non-Closed patterns takes "
                + (postProcessingEnd - postProcessingStart) / 1000 + " seconds and finds "
                + numberOfFrequentClosedPatterns + " closed patterns");

        numberOfFrequentPatterns = frequentPatternEnumeration.getFrequentPatterns();
        frequentPatternEnumeration.clear();

        // check the memory usage for statistics
        MemoryLogger.getInstance().checkMemory();

        joinCount = frequentPatternEnumeration.joinCount;
    }

    /**
     * Method to show the outlined information about the search for frequent
     * sequences by means of ClaSP algorithm
     *
     * @return
     */
    public String printStatistics() {
        StringBuilder r = new StringBuilder(200);
        r.append("=============  Algorithm - STATISTICS =============\n Total time ~ ");
        r.append(getRunningTime());
        r.append(" ms\n");
        r.append(" Frequent patterns: ");
        r.append(numberOfFrequentPatterns);
        r.append("\n Frequent closed sequences count : ");
        r.append(numberOfFrequentClosedPatterns);
        r.append('\n');
        r.append(" Join count : ");
        r.append(joinCount);
        r.append(" Max memory (mb):");
        r.append(MemoryLogger.getInstance().getMaxMemory());
        r.append('\n');
        r.append(saver.print());
        r.append("\n===================================================\n");
        return r.toString();
    }

    public List<String> getResutl() {
        return saver.getList();
    }

    public int getNumberOfFrequentPatterns() {
        return numberOfFrequentPatterns;
    }

    public int getNumberOfFrequentClosedPatterns() {
        return numberOfFrequentClosedPatterns;
    }

    /**
     * It gets the time spent by the algoritm in its execution.
     *
     * @return
     */
    public long getRunningTime() {
        return (overallEnd - overallStart);
    }

    /**
     * It clears all the attributes of AlgoClaSP class
     */
    public void clear() {
        FrequentAtomsTrie.removeAll();
        abstractionCreator = null;
    }

    /**
     * Get the trie (internal structure used by ClaSP).
     * 
     * @return the trie
     */
    public Trie getFrequentAtomsTrie() {
        return FrequentAtomsTrie;
    }

}
