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
        List<String> itemConstraint = Arrays.asList();
        String[] sequences = { 
            "usernameGenerator usernameValidator -1 usernameValidator emailValidator -1 -2"
            ,"usernameGenerator checkUniquness -1 usernameValidator -1 emailValidator checkEmailUniqueness -1 -2"
           ,"emailValidator checkEmailUniquness usernameValidator -1 errorHandler -2 "
           ,"randomGenerator usernameGenerator -1 usernameGenerator usernameValidator emailValidator -1 -2" 
       
             };
            //  "checkUniqueness usernameValidator -1 #SUP: 1, 
            //  emailValidator usernameValidator -1 #SUP: 2, 
            //  random usernameValidator -1 #SUP: 0, 
            //  random -1 usernameValidator -1 #SUP: 2, 
            //  usernameGenerator -1 checkUniqueness -1 #SUP: 2, 
            //  usernameGenerator usernameValidator -1 #SUP: 1, 
            //  usernameValidator -1 emailValidator -1 #SUP: 2, 
            //  checkUniqueness -1 checkEmailUniqueness emailValidator -1 #SUP: 2"
        // AlgoCM_ClaSPExecutor.runFile(itemConstraint, support,
        // "contextPrefixSpan.txt", null);
        System.out.println(AlgoCM_ClaSPExecutor.runList(itemConstraint, support, sequences, null, null));
    }
}
