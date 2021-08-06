package clasp_AGP;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.util.List;

import clasp_AGP.dataStructures.creators.AbstractionCreator;
import clasp_AGP.dataStructures.creators.AbstractionCreator_Qualitative;
import clasp_AGP.dataStructures.database.SequenceDatabase;
import clasp_AGP.idlists.creators.IdListCreator;
import clasp_AGP.idlists.creators.IdListCreatorStandard_Map;
import main.MainTestCMClaSP_saveToFile;

/**
 * Example of how to use the algorithm ClaSP, saving the results in the main
 * memory
 *
 * @author agomariz
 */
public class AlgoCM_ClaSPExecutor {

    /**
     * @param itemConstraint a list of strings/items as our item constraint
     * @param support        min support
     * @param filePath       sequences where is sequences as a string or sequences
     *                       file path where they are stored.
     * @param outputPath     file path to store the result. null if want to store in
     *                       memory
     */
    public static void runFile(List<String> itemConstraint, double support, String filePath, String outputPath)
            throws IOException {

        // Load a sequence database
        // double support = 0.5;

        boolean keepPatterns = true;
        boolean verbose = true;
        boolean findClosedPatterns = true;
        boolean executePruningMethods = true;
        // if you set the following parameter to true, the sequence ids of the sequences
        // where
        // each pattern appears will be shown in the result
        boolean outputSequenceIdentifiers = false;

        AbstractionCreator abstractionCreator = AbstractionCreator_Qualitative.getInstance();
        IdListCreator idListCreator = IdListCreatorStandard_Map.getInstance();

        SequenceDatabase sequenceDatabase = new SequenceDatabase(abstractionCreator, idListCreator, itemConstraint);

        double relativeSupport = sequenceDatabase.loadFile(fileToPath(filePath), support);

        AlgoCM_ClaSP algorithm = new AlgoCM_ClaSP(relativeSupport, abstractionCreator, findClosedPatterns,
                executePruningMethods, itemConstraint);

        // System.out.println(sequenceDatabase.toString());
        algorithm.runAlgorithm(sequenceDatabase, keepPatterns, verbose, outputPath, outputSequenceIdentifiers);
        System.out.println("Minsup (relative) : " + support);
        System.out.println(algorithm.getNumberOfFrequentPatterns() + " patterns found.");

        if (verbose && keepPatterns) {
            System.out.println(algorithm.printStatistics());
        }

        // uncomment if we want to see the Trie graphically
        // ShowTrie.showTree(algorithm.getFrequentAtomsTrie());

    }

    public static List<String> runList(List<String> itemConstraint, double support, String[] sequences, String outputPath)
            throws IOException {

        // Load a sequence database
        // double support = 0.5;

        boolean keepPatterns = true;
        boolean verbose = true;
        boolean findClosedPatterns = true;
        boolean executePruningMethods = true;
        // if you set the following parameter to true, the sequence ids of the sequences
        // where
        // each pattern appears will be shown in the result
        boolean outputSequenceIdentifiers = false;

        AbstractionCreator abstractionCreator = AbstractionCreator_Qualitative.getInstance();
        IdListCreator idListCreator = IdListCreatorStandard_Map.getInstance();

        SequenceDatabase sequenceDatabase = new SequenceDatabase(abstractionCreator, idListCreator, itemConstraint);

        double relativeSupport = sequenceDatabase.loadList(sequences, support);

        AlgoCM_ClaSP algorithm = new AlgoCM_ClaSP(relativeSupport, abstractionCreator, findClosedPatterns,
                executePruningMethods, itemConstraint);

        // System.out.println(sequenceDatabase.toString());
        algorithm.runAlgorithm(sequenceDatabase, keepPatterns, verbose, outputPath, outputSequenceIdentifiers);
        return algorithm.getResutl();
        // System.out.println("Minsup (relative) : " + support);
        // System.out.println(algorithm.getNumberOfFrequentPatterns() + " patterns found.");

        // if (verbose && keepPatterns) {
        //     System.out.println(algorithm.printStatistics());
        // }

        // uncomment if we want to see the Trie graphically
        // ShowTrie.showTree(algorithm.getFrequentAtomsTrie());

    }

    public static String fileToPath(String filename) throws UnsupportedEncodingException {
        URL url = MainTestCMClaSP_saveToFile.class.getResource(filename);
        return java.net.URLDecoder.decode(url.getPath(), "UTF-8");
    }
}
