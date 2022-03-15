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
                "a b c g -1",
                "a d c e g -1",
                "a b g -1",
                "e f g -1" };

        String[] expectedOutput = { "g -1 #SUP: 1.0", "a g -1 #SUP: 0.75", "e g -1 #SUP: 0.5", "a b g -1 #SUP: 0.5",
                "a c g -1 #SUP: 0.5", "e f g -1 #SUP: 1.0" };

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, 0.5, sequences, null);
        System.out.println(result);

        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testReptitivePatternNoItemset() throws IOException {
        List<String> itemConstraint = Arrays.asList("f");
        String[] sequences = { "a b c f g -1", "a b c f g -1",
                "a b c f g -1", "a b c f g -1" };

        String[] expectedOutput = { "a b c f g -1 #SUP: 1.0" };
        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, 0.5, sequences, null);
        assertArrayEquals(expectedOutput, result.toArray());
    }


    @Test
    void notOrderedItemset() throws IOException {
        List<String> itemConstraint = Arrays.asList("f");
        String[] sequences = { "a b c g f -1", "a b c f g -1",
                "a b c g f -1"};
        String[] expectedOutput = { "a b c f -1 #SUP: 1.0" };
        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, 0.5, sequences, null);
        assertArrayEquals(expectedOutput, result.toArray());
        
    }

}
