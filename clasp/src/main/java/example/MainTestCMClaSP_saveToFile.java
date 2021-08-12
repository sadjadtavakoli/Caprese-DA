package example;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import clasp_AGP.AlgoCM_ClaSPExecutor;

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
        double support = 0.5;
        List<String> itemConstraint = Arrays.asList("a");
        String[] sequences = { "b -1 a -1 c -1 d -1 d -1 -2", "b -1 a -1 c -1 d -1 d -1 -2",
                "b -1 a -1 c -1 d -1 d -1 -2", "b -1 a -1 c -1 d -1 d -1 -2" };

        // AlgoCM_ClaSPExecutor.runFile(itemConstraint, support,
        // "contextPrefixSpan.txt", null);
        System.out.println(AlgoCM_ClaSPExecutor.runList(itemConstraint, support, sequences, null).toString());
    }
}
