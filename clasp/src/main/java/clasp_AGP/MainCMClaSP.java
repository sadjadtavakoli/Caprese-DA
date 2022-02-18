package clasp_AGP;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Example of how to use the algorithm ClaSP, saving the results in a given file
 *
 * @author agomariz
 */
public class MainCMClaSP {

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) throws IOException {
        double support = 0.2;
        String filePath = args[0];
        String distFilePath = args[1];
        String itemsFrequenciesPath = args[2];
        List<String> itemConstraint = Arrays.asList(args[3].split(","));
        if ("-1".equals(itemConstraint.get(0))) {
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
        System.out.println(AlgoCM_ClaSPExecutor.runFile(itemConstraint, support, filePath, distFilePath, itemsFrequenciesPath));
    }
}
