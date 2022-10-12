package clasp_AGP;

import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import clasp_AGP.dataStructures.ImpactInformation;
import clasp_AGP.dataStructures.Sequence;
import clasp_AGP.dataStructures.creators.AbstractionCreator;
import clasp_AGP.dataStructures.database.SequenceDatabase;
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
     * The absolute minimum confidence threshold, i.e. the minimum number of sequences
     * where the patterns have to be wrt itemConstraints
     */
    protected double minimumConfidence;

    /**
     * The absolute minimum confidence threshold, i.e. the minimum number of sequences
     * where the patterns have to be wrt itemConstraints, to be consider as detected
     */
    protected double enoughConfidence;
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
    private int numberOfFrequentPatterns;
    /**
     * flag to indicate if we are interesting in only finding the closed sequences
     */
    protected Map<String, TrieNode> itemConstraints;

    public long joinCount; // PFV 2013

    /**
     * Constructor of the class that calls ClaSP algorithm.
     *
     * @param minimumConfidence minimum confidence
     * @param abstractionCreator the abstraction creator
     */
    public AlgoCM_ClaSP(double minimumConfidence, double enoughConfidence, AbstractionCreator abstractionCreator) {
        this.minimumConfidence = minimumConfidence;
        this.enoughConfidence = enoughConfidence;
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
     * @throws IOException
     */
    public void runAlgorithm(SequenceDatabase database, String outputFilePath) throws IOException {
        // If we do no have any file path
        if (outputFilePath == null || outputFilePath.equals("-")) {
            // The user wants to save the results in memory
            saver = new SaverIntoMemory();
        } else {
            // Otherwise, the user wants to save them in the given file
            saver = new SaverIntoFile(outputFilePath);
        }
        // reset the stats about memory usage
        MemoryLogger.getInstance().reset();
        // keeping the starting time
        // overallStart = System.currentTimeMillis();
        // Starting ClaSP algorithm
        claSP(database, minimumConfidence, enoughConfidence);
        // keeping the ending time
        // overallEnd = System.currentTimeMillis();
        // Search for frequent patterns: Finished
        saver.finish();
    }

    /**
     * The actual method for extracting frequent sequences.
     *
     * @param database       The original database
     * @param minimumConfidence the minimum confidence
     */
    protected void claSP(SequenceDatabase database, double minimumConfidence, double enoughConfidence) {
        // We get the initial trie whose children are the frequent 1-patterns
        FrequentAtomsTrie = database.frequentItems();
        itemConstraints = database.itemConstraints();


        Map<String, Set<String>> coocMap = recordCoOccurrences(database);
        database.clear();

        // Inizialitation of the class that is in charge of find the frequent patterns
        FrequentPatternEnumeration_ClaSP frequentPatternEnumeration = new FrequentPatternEnumeration_ClaSP(
                abstractionCreator, minimumConfidence, enoughConfidence, saver, itemConstraints , coocMap);

        // We dfsPruning the search
        frequentPatternEnumeration.dfsPruning(FrequentAtomsTrie);

        // Once we had finished, we keep the number of frequent patterns that we found
        numberOfFrequentPatterns = frequentPatternEnumeration.getFrequentPatterns();

        // check the memory usage for statistics
        MemoryLogger.getInstance().checkMemory();

        frequentPatternEnumeration.pruneImpactSet();

        frequentPatternEnumeration.clear();

        // check the memory usage for statistics
        MemoryLogger.getInstance().checkMemory();

        joinCount = frequentPatternEnumeration.joinCount;
    }

    private Map<String, Set<String>> recordCoOccurrences(SequenceDatabase database) {
        Map<String, Set<String>> coocMap = new HashMap<>(1000);

        /**
        * For each item foo after a function bar in the same sequence we add a true value 
        * to the row foo and column var. This value indicates foo occured after bar in a sequence.
        */
        for (Sequence seq : database.getSequences()) {
            for (int j = 0; j < seq.size(); j++) {
                String itemA = (String) seq.get(j).getId();

                // get or create the map if not existing already
                Set<String> mapCoocItem = coocMap.computeIfAbsent(itemA, k -> new HashSet<>());

                // keep each item after itemA in the same sequence
                for (int k = j + 1; k < seq.size(); k++) {
                    String itemB = (String) seq.get(k).getId();
                    if (!mapCoocItem.contains(itemB)) {
                        mapCoocItem.add(itemB);
                    }
                }
            }
        }
        return coocMap;
    }

    /**
     * Method to show the outlined information about the search for frequent
     * sequences by means of ClaSP algorithm
     *
     * @return
     */
    public String printStatistics() {
        StringBuilder r = new StringBuilder(200);
        // r.append("=============  Algorithm - STATISTICS =============\n Total time ~ ");
        // r.append(overallEnd - overallStart);
        // r.append(" ms\n");
        // r.append(" Frequent patterns: ");
        // r.append(numberOfFrequentPatterns);
        // r.append("\n ImpactSet Size : ");
        // r.append(saver.resultSize());
        // r.append('\n');
        // r.append(" Join count : ");
        // r.append(joinCount);
        // r.append(" Max memory (mb):");
        // r.append(MemoryLogger.getInstance().getMaxMemory());
        // r.append('\n');
        // r.append(saver.print());
        // r.append("\n===================================================\n");
        return r.toString();
    }

    public Map<String, ImpactInformation> getResut() {
        return saver.getList();
    }
}
