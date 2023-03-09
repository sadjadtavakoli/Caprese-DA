package TARMAQ;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Example of how to use the algorithm ClaSP, saving the results in a given file
 *
 * @author agomariz
 */
public class MainTARMAQ {

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) throws IOException {
        String sequencesPath = args[0];
        String distFilePath = args[1];
        List<String> itemConstraint = Arrays.asList(args[2].split(","));
        if ("-".equals(itemConstraint.get(0))) {
            itemConstraint = new ArrayList<>();
        }
        Runtime rt = Runtime.getRuntime();
        long totalMem = rt.totalMemory();
        long maxMem = rt.maxMemory();
        long freeMem = rt.freeMemory();
        double megs = 1048576.0;

        System.out.println("Total Memory: " + totalMem + " (" + (totalMem / megs) + " MiB)");
        System.out.println("Max Memory:   " + maxMem + " (" + (maxMem / megs) + " MiB)");
        System.out.println("Free Memory:  " + freeMem + " (" + (freeMem / megs) + " MiB)");
        AlgoTARMAQExecutor.runFile(itemConstraint, sequencesPath, distFilePath);
    }
}
