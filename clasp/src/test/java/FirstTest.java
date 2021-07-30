import org.junit.jupiter.api.Test;

import clasp_AGP.AlgoCM_ClaSPExecutor;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * Unit test for simple App.
 */
class FirstTest {

    @Test
    void testReqularOne() throws IOException {
        List<String> itemConstraint = Arrays.asList("6", "7", "8");
        String[] sequences = {
            "1 -1 6 1 2 3 -1 1 3 -1 4 -1 3 -1 -2", 
            "1 4 -1 3 -1 2 3 -1 1 5 -1 -2",
            "5 6 -1 1 2 -1 4 -1 3 -1 2 -1 -2", 
            "5 -1 7 -1 1 6 -1 3 -1 2 -1 3 -1 -2" };

        String[] expectedOutput = { 
            "6 -1 1 -1 #SUP: 2",
            "6 -1 2 -1 #SUP: 2",
            "6 -1 3 -1 #SUP: 3",
            "6 -1 4 -1 #SUP: 2" };

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, 0.5, sequences, null);
        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testReptitivePatternNoItemset() throws IOException {
        List<String> itemConstraint = Arrays.asList("6");
        String[] sequences = {
            "1 -1 6 -1 3 -1 4 -1 4 -1 -2", 
            "1 -1 6 -1 3 -1 4 -1 4 -1 -2", 
            "1 -1 6 -1 3 -1 4 -1 4 -1 -2", 
            "1 -1 6 -1 3 -1 4 -1 4 -1 -2"};

        String[] expectedOutput = {"1 -1 6 -1 3 -1 4 -1 4 -1 #SUP: 4"};

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, 0.5, sequences, null);
        System.out.println(result.toString());
        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testReptitivePatternItemset() throws IOException {
        List<String> itemConstraint = Arrays.asList("6");
        String[] sequences = {
            "1 4 -1 6 -1 3 4 -1 4 -1 -2", 
            "1 4 -1 6 -1 3 4 -1 4 -1 -2", 
            "1 4 -1 6 -1 3 4 -1 4 -1 -2", 
            "1 4 -1 6 -1 3 4 -1 4 -1 -2"};

        String[] expectedOutput = {"1 4 -1 6 -1 3 4 -1 4 -1 #SUP: 4"};

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, 0.5, sequences, null);
        System.out.println(result.toString());
        assertArrayEquals(expectedOutput, result.toArray());
    }


    @Test
    void testOverlappedPatternItemset() throws IOException {
    }

}
