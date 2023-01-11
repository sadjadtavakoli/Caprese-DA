package patterndetection;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.io.FileWriter;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;
import java.util.Map.Entry;
import java.util.logging.Level;
import java.util.logging.Logger;

import patterndetection.dataStructures.ImpactInformation;
import patterndetection.dataStructures.Sequence;
import patterndetection.dataStructures.creators.AbstractionCreator;
import patterndetection.dataStructures.creators.AbstractionCreator_Qualitative;
import patterndetection.dataStructures.database.SequenceDatabase;
import patterndetection.idlists.creators.IdListCreator;
import patterndetection.idlists.creators.IdListCreatorStandard_Map;
import patterndetection.tries.Trie;
import patterndetection.tries.TrieNode;


public class MainAlgorithm {

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) throws IOException {
        double minumumConfidence = 0.4;
        double enoughConfidence = minumumConfidence;
        String filePath = args[0];
        String distFilePath = args[1];
        List<String> itemConstraint = Arrays.asList(args[2].split(","));
        if ("-".equals(itemConstraint.get(0))) {
            itemConstraint = new ArrayList<>();
        }

        runFile(itemConstraint, minumumConfidence, enoughConfidence, filePath, distFilePath);
    }

    /**
     * @param itemConstraint       a list of strings/items as our item constraint
     * @param minimumConfidence    min support
     * @param filePath             sequences where is sequences as a string or
     *                             sequences
     *                             file path where they are stored.
     * @param outputPath           file path to store the result. null if want to
     *                             store in
     *                             memory
     * @param itemsFrequenciesPath the path in which each items frequency should be
     *                             stored
     */
    public static Map<String, ImpactInformation> runFile(List<String> itemConstraint, double minimumConfidence,
            double enoughConfidence, String filePath, String outputPath)
            throws IOException {

        AbstractionCreator abstractionCreator = AbstractionCreator_Qualitative.getInstance();
        IdListCreator idListCreator = IdListCreatorStandard_Map.getInstance();

        SequenceDatabase sequenceDatabase = new SequenceDatabase(abstractionCreator, idListCreator, itemConstraint,
                filePath);

        Map<String, ImpactInformation> result = runAlgorithm(abstractionCreator, minimumConfidence, enoughConfidence,
                sequenceDatabase);

        if (outputPath == null || outputPath.equals("-")) {
            // The user wants to save the results in memory
            System.out.println(result);
        } else {
            // Otherwise, the user wants to save them in the given file
            writeToFile(outputPath, result);
        }

        return result;
    }

    private static void writeToFile(String outputPath, Map<String, ImpactInformation> result) throws IOException {
        try (FileWriter file = new FileWriter(outputPath, false)) {
            StringBuilder r = new StringBuilder("{");
            for (Entry<String, ImpactInformation> impactedFunction : result.entrySet()) {
                r.append("\"");
                r.append(impactedFunction.getKey());
                r.append("\":");
                r.append(impactedFunction.getValue());
                r.append(",");
            }
            r.append("\"\":\"\"}");
            try {
                file.write(r.toString());
                file.flush();
            } catch (IOException ex) {
                Logger.getLogger(MainAlgorithm.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
    }

    public static Map<String, ImpactInformation> runList(List<String> itemConstraint, double minumumConfidence,
            double enoughConfidence, String[] sequences,
            String outputPath) throws IOException {

        String filePath = "input.txt";
        StringBuilder sequencesString = new StringBuilder();
        try (FileWriter myWriter = new FileWriter(filePath, false)) {
            for (int i = 0; i < sequences.length; i++) {
                // If the line is not a comment line
                sequencesString.append(sequences[i]).append("\n");
            }
            myWriter.write(sequencesString.toString());
        } catch (IOException e) {
            e.printStackTrace();
        }
        return runFile(itemConstraint, minumumConfidence, enoughConfidence, filePath, outputPath);
    }

    /**
     * @param abstractionCreator the abstraction creator
     * @param minimumConfidence  minimum confidence
     * @param enoughConfidence   enough confidence
     * @param database           Original database in where we want to search
     *                           for the frequent patterns.
     */
    private static Map<String, ImpactInformation> runAlgorithm(AbstractionCreator abstractionCreator,
            double minimumConfidence,
            double enoughConfidence, SequenceDatabase database) throws IOException {
        /**
         * Trie root that starts with the empty pattern and from which we will be able
         * to access to all the generated frequent patterns 
         * We get the initial trie whose children are the frequent 1-patterns
         */
        Trie frequentAtomsTrie = database.frequentItems();

        Map<String, TrieNode> itemConstraints = database.itemConstraints();

        Map<String, Set<String>> coocMap = coChangeDetection(database);

        database.clear();

        // Inizialitation of the class that is in charge of find the frequent patterns
        FrequentPatternEnumeration frequentPatternEnumeration = new FrequentPatternEnumeration(
                abstractionCreator, minimumConfidence, enoughConfidence, itemConstraints, coocMap);

        // We dfsPruning the search
        return frequentPatternEnumeration.dfsPruning(frequentAtomsTrie);
    }

    private static Map<String, Set<String>> coChangeDetection(SequenceDatabase database) {
        Map<String, Set<String>> coocMap = new HashMap<>(1000);

        /**
         * For each item foo after a function bar in the same sequence we add a true
         * value
         * to the row foo and column var. This value indicates foo occured after bar in
         * a sequence.
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

}
