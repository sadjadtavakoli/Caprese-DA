package example;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import patterndetection.MainAlgorithm;

/**
 * Example of how to use the algorithm, saving the results in a given file
 *
 * @author agomariz
 */
public class MainTestAlgorithmRunner {

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) throws IOException {
        double minimumConfidence = 0.5;
        List<String> itemConstraint = Arrays.asList("f", "g");
        String[] sequences = {
            "f -1",       
            "f -1",       
            "f -1",       
            "f -1",       
            "f -1",       
            "a f g h -1",       
            "a f g h -1",       
            "a f g h -1",
            "g -1",
            "g -1",
            "g -1",
            "g -1",
            "g -1"
        };
            //  "checkUniqueness usernameValidator -1 #SUP: 1,
            //  emailValidator usernameValidator -1 #SUP: 2, 
            //  random usernameValidator -1 #SUP: 0, 
            //  random -1 usernameValidator -1 #SUP: 2, 
            //  usernameGenerator -1 checkUniqueness -1 #SUP: 2, 
            //  usernameGenerator usernameValidator -1 #SUP: 1, 
            //  usernameValidator -1 emailValidator -1 #SUP: 2, 
            //  checkUniqueness -1 checkEmailUniqueness emailValidator -1 #SUP: 2"
        // dadada.runFile(itemConstraint, support,
        // "contextPrefixSpan.txt", null);
        MainAlgorithm.runList(itemConstraint, minimumConfidence, sequences, "outputOO_OO.txt");
    }
}
