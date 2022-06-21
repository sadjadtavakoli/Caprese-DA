package clasp_AGP;

import java.io.FileWriter;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.util.List;

import clasp_AGP.dataStructures.creators.AbstractionCreator;
import clasp_AGP.dataStructures.creators.AbstractionCreator_Qualitative;
import clasp_AGP.dataStructures.database.SequenceDatabase;
import clasp_AGP.idlists.creators.IdListCreator;
import clasp_AGP.idlists.creators.IdListCreatorStandard_Map;
import example.MainTestCMClaSP_saveToFile;

/**
 * Example of how to use the algorithm ClaSP, saving the results in the main
 * memory
 *
 * @author agomariz
 */
public class AlgoCM_ClaSPExecutor {

    /**
     * @param itemConstraint     a list of strings/items as our item constraint
     * @param minimumConfidence            min support
     * @param filePath           sequences where is sequences as a string or sequences
     *                           file path where they are stored.
     * @param outputPath         file path to store the result. null if want to store in
     *                           memory
     * @param itemsFrequenciesPath the path in which each items frequency should be stored 
     */
    public static List<String> runFile(List<String> itemConstraint, double minimumConfidence, double minimumConfidenceToStop, String filePath, String outputPath)
            throws IOException {

        // if you set the following parameter to true, the sequence ids of the sequences
        // where
        // each pattern appears will be shown in the result
        boolean outputSequenceIdentifiers = false;

        AbstractionCreator abstractionCreator = AbstractionCreator_Qualitative.getInstance();
        IdListCreator idListCreator = IdListCreatorStandard_Map.getInstance();

        SequenceDatabase sequenceDatabase = new SequenceDatabase(abstractionCreator, idListCreator, itemConstraint);

        sequenceDatabase.loadFile(filePath);

        AlgoCM_ClaSP algorithm = new AlgoCM_ClaSP(minimumConfidence, minimumConfidenceToStop, abstractionCreator);

        algorithm.runAlgorithm(sequenceDatabase, outputPath, outputSequenceIdentifiers);
        System.out.println("Minsup (relative) : " + minimumConfidence);
        System.out.println(algorithm.getNumberOfFrequentPatterns() + " patterns found.");

        System.out.println(algorithm.printStatistics());
        return algorithm.getResutl();

        // uncomment if we want to see the Trie graphically
        // ShowTrie.showTree(algorithm.getFrequentAtomsTrie());

    }

    public static List<String> runList(List<String> itemConstraint, double minumumConfidence, double minumumConfidenceToStop, String[] sequences,
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
        return runFile(itemConstraint, minumumConfidence, minumumConfidenceToStop, filePath, outputPath);
    }

    public static String fileToPath(String filename) throws UnsupportedEncodingException {
        URL url = MainTestCMClaSP_saveToFile.class.getResource(filename);
        return java.net.URLDecoder.decode(url.getPath(), "UTF-8");
    }
}
