import org.junit.jupiter.api.Test;

import clasp_AGP.AlgoCM_ClaSPExecutor;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * Unit test for simple App.
 */
class FirstTest {

    @Test
    void testReqularOne() throws IOException {
        List<String> itemConstraint = Arrays.asList("f", "g", "h");
        String[] sequences = { 
            "a -1 f a b c -1 a c -1 d -1 c -1 -2", 
            "a d -1 c -1 b c -1 a e -1 -2",
            "e f -1 a b -1 d -1 c -1 b -1 -2", 
            "e -1 7 -1 a f -1 c -1 b -1 c -1 -2" };

        String[] expectedOutput = { "f -1 c -1 #SUP: 3", "f -1 b -1 c -1 #SUP: 2", "f -1 c -1 b -1 #SUP: 2",
                "f -1 c -1 c -1 #SUP: 2", "f -1 a -1 d -1 c -1 #SUP: 2" };

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, 0.5, sequences, null);
        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testReptitivePatternNoItemset() throws IOException {
        List<String> itemConstraint = Arrays.asList("f");
        String[] sequences = { "a -1 f -1 c -1 d -1 d -1 -2", "a -1 f -1 c -1 d -1 d -1 -2",
                "a -1 f -1 c -1 d -1 d -1 -2", "a -1 f -1 c -1 d -1 d -1 -2" };

        String[] expectedOutput = { "a -1 f -1 c -1 d -1 d -1 #SUP: 4" };

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, 0.5, sequences, null);
        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testReptitivePatternItemset() throws IOException {
        List<String> itemConstraint = Arrays.asList("f");
        String[] sequences = { "a d -1 f -1 c d -1 d -1 -2", "a d -1 f -1 c d -1 d -1 -2", "a d -1 f -1 c d -1 d -1 -2",
                "a d -1 f -1 c d -1 d -1 -2" };

        String[] expectedOutput = { "a d -1 f -1 c d -1 d -1 #SUP: 4" };

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, 0.5, sequences, null);
        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testReptitivePatternsInAndbetweenItemset() throws IOException {
        String[] sequences = {
            "a d -1 f -1 c d -1 d -1 -2", 
            "a d -1 f -1 c d -1 d -1 -2", 
            "a d -1 f -1 c d -1 d -1 -2",
            "a d -1 f -1 c d -1 d -1 -2" 
        };

    }

}
