package spmf.test;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.util.Arrays;
import java.util.List;

import spmf.clasp_AGP.AlgoCM_ClaSP;
import spmf.clasp_AGP.dataStructures.creators.AbstractionCreator;
import spmf.clasp_AGP.dataStructures.creators.AbstractionCreator_Qualitative;
import spmf.clasp_AGP.dataStructures.database.SequenceDatabase;
import spmf.clasp_AGP.idlists.creators.IdListCreator;
import spmf.clasp_AGP.idlists.creators.IdListCreatorStandard_Map;

/**
 * Example of how to use the algorithm ClaSP, saving the results in a given file
 *
 * @author agomariz
 */
public class MainTestCMClaSP_saveToFile {

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) throws IOException {
        // Load a sequence database
        double support = 0.5;

        boolean keepPatterns = true;
        boolean verbose = true;
        boolean findClosedPatterns = true;
        boolean executePruningMethods = true;
     // if you set the following parameter to true, the sequence ids of the sequences where
        // each pattern appears will be shown in the result
        boolean outputSequenceIdentifiers = false;

        AbstractionCreator abstractionCreator = AbstractionCreator_Qualitative.getInstance();
        IdListCreator idListCreator = IdListCreatorStandard_Map.getInstance();
        List<String> itemConstraint = Arrays.asList("3"); // TODO sadjad shouldn't be here! it should be an input to the whole algorithm called from outside :!?

        SequenceDatabase sequenceDatabase = new SequenceDatabase(abstractionCreator, idListCreator, itemConstraint);

        //double relativeSupport = sequenceDatabase.loadFile(fileToPath("contextClaSP.txt"), support);
        double relativeSupport = sequenceDatabase.loadFile(fileToPath("contextPrefixSpan.txt"), support);

        AlgoCM_ClaSP algorithm = new AlgoCM_ClaSP(relativeSupport, abstractionCreator, findClosedPatterns, executePruningMethods, itemConstraint);


        //System.out.println(sequenceDatabase.toString());
        algorithm.runAlgorithm(sequenceDatabase, keepPatterns, verbose, ".//output.txt",outputSequenceIdentifiers);
        System.out.println("Minsup (relative) : " + support);
        System.out.println(algorithm.getNumberOfFrequentPatterns() + " patterns found.");

        if (verbose && keepPatterns) {
            System.out.println(algorithm.printStatistics());
        }

      //uncomment if we want to see the Trie graphically
//        ShowTrie.showTree(algorithm.getFrequentAtomsTrie());
    }

    public static String fileToPath(String filename) throws UnsupportedEncodingException {
        URL url = MainTestCMClaSP_saveToFile.class.getResource(filename);
        return java.net.URLDecoder.decode(url.getPath(), "UTF-8");
    }
}
