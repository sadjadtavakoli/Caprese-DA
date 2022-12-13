package clasp_AGP;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.io.FileWriter;
import clasp_AGP.dataStructures.ImpactInformation;
import clasp_AGP.dataStructures.creators.AbstractionCreator;
import clasp_AGP.dataStructures.creators.AbstractionCreator_Qualitative;
import clasp_AGP.dataStructures.database.SequenceDatabase;
import clasp_AGP.idlists.creators.IdListCreator;
import clasp_AGP.idlists.creators.IdListCreatorStandard_Map;

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
        double minumumConfidence = 0.4;
        double enoughConfidence = minumumConfidence;
        String filePath = args[0];
        String distFilePath = args[1];
        List<String> itemConstraint = Arrays.asList(args[2].split(","));
        if ("-".equals(itemConstraint.get(0))) {
            itemConstraint = new ArrayList<>();
        }

        System.out.println(runFile(itemConstraint, minumumConfidence, enoughConfidence, filePath, distFilePath));
    }

    /**
     * @param itemConstraint     a list of strings/items as our item constraint
     * @param minimumConfidence            min support
     * @param filePath           sequences where is sequences as a string or sequences
     *                           file path where they are stored.
     * @param outputPath         file path to store the result. null if want to store in
     *                           memory
     * @param itemsFrequenciesPath the path in which each items frequency should be stored 
     */
    public static Map<String, ImpactInformation> runFile(List<String> itemConstraint, double minimumConfidence, double enoughConfidence, String filePath, String outputPath)
            throws IOException {

        AbstractionCreator abstractionCreator = AbstractionCreator_Qualitative.getInstance();
        IdListCreator idListCreator = IdListCreatorStandard_Map.getInstance();

        SequenceDatabase sequenceDatabase = new SequenceDatabase(abstractionCreator, idListCreator, itemConstraint);

        sequenceDatabase.loadFile(filePath);

        AlgoCMClaSP algorithm = new AlgoCMClaSP(minimumConfidence, enoughConfidence, abstractionCreator);

        algorithm.runAlgorithm(sequenceDatabase, outputPath);

        return algorithm.getResut();
    }

    public static Map<String, ImpactInformation> runList(List<String> itemConstraint, double minumumConfidence, double enoughConfidence, String[] sequences,
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
}
