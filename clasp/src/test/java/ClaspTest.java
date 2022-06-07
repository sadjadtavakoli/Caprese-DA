import org.junit.jupiter.api.Test;
import clasp_AGP.AlgoCM_ClaSPExecutor;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * Unit test for simple App.
 */
public class ClaspTest {

    @Test
    void testItemConstraintsOneLengthPatternNotIncluded() throws IOException {
        List<String> itemConstraint = Arrays.asList("f");
        double minimumConfidence = 0.5;
        String[] sequences = {
                "a b c g -1",
                "a d c f -1",
                "a b g -1",
                "e f g -1",
                "e f g -1",
        };

        String[] expectedOutput = { "g -1 #CONF: 1.0 #SUP: 3", "e f g -1 #CONF: 0.6666666666666666 #SUP: 2" };

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, sequences, null);
        System.out.println(result);

        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testItemConstraintsOneLengthPatternIncluded() throws IOException {
        List<String> itemConstraint = Arrays.asList("f");
        double minimumConfidence = 0.5;
        String[] sequences = {
                "a b c g -1",
                "a d c f g -1",
                "a b g -1",
                "e f g -1",
                "e f g -1",
        };

        String[] expectedOutput = { "f g -1 #CONF: 1.0 #SUP: 3", "e f g -1 #CONF: 0.6666666666666666 #SUP: 2" };

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, sequences, null);
        System.out.println(result);

        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testSingleItemConstraints() throws IOException {
        List<String> itemConstraint = Arrays.asList("f");
        double minimumConfidence = 0.5;
        String[] sequences = {
                "a b c g -1",
                "a d c e g -1",
                "a b g -1",
                "e f g -1" };

        String[] expectedOutput = { "e f g -1 #CONF: 1.0 #SUP: 1" };

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, sequences, null);
        System.out.println(result);

        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testNotExistedItemConstraints() throws IOException {
        List<String> itemConstraint = Arrays.asList("h");
        double minimumConfidence = 0.5;
        String[] sequences = {
                "a b c g -1",
                "a d c e g -1",
                "a b g -1",
                "e f g -1" };

        String[] expectedOutput = {};

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, sequences, null);
        System.out.println(result);

        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testEmptyItemConstraints() throws IOException {
        List<String> itemConstraint = Arrays.asList();
        double minimumConfidence = 0.5;
        String[] sequences = {
                "a b c g -1",
                "a d c e g -1",
                "a b g -1",
                "e f g -1" };

        String[] expectedOutput = { "a b c g -1",
                "a d c e g -1",
                "a b g -1",
                "e f g -1" };

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, sequences, null);
        System.out.println(result);

        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testAllitemsInconstraints() throws IOException {
        List<String> itemConstraint = Arrays.asList("a", "b", "c", "d");
        double minimumConfidence = 0.5;
        String[] sequences = {
                "a b c -1",
                "a d c -1",
                "a b -1",
                "d -1" };

        String[] expectedOutput = { "a c -1" };

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, sequences, null);
        System.out.println(result);

        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testNonFrequentPaisCoOccurranceBeforeConstraints() throws IOException {
        List<String> itemConstraint = Arrays.asList("f", "g");
        double minimumConfidence = 0.5;
        String[] sequences = {
                "f -1",
                "f -1",
                "f -1",
                "f -1",
                "f -1",
                "a f g -1",
                "a f g -1",
                "a f g -1",
                "g -1",
                "g -1",
                "g -1",
                "g -1",
                "g -1"
        };

        String[] expectedOutput = { "f -1 #CONF: 1.0 #SUP: 8", "g -1 #CONF: 1.0 #SUP: 8",
                "a f g -1 #CONF: 1.0 #SUP: 3" };

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, sequences, null);
        System.out.println(result);

        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testNonFrequentPaisCoOccurranceAfterConstraints() throws IOException {
        List<String> itemConstraint = Arrays.asList("f", "g");
        double minimumConfidence = 0.5;
        String[] sequences = {
                "f -1",
                "f -1",
                "f -1",
                "f -1",
                "f -1",
                "f g h -1",
                "f g h -1",
                "f g h -1",
                "g -1",
                "g -1",
                "g -1",
                "g -1",
                "g -1"
        };

        String[] expectedOutput = { "f -1 #CONF: 1.0 #SUP: 8", "g -1 #CONF: 1.0 #SUP: 8",
                "f g h -1 #CONF: 1.0 #SUP: 3" };

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, sequences, null);
        System.out.println(result);

        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testNonFrequentPaisCoOccurranceAfterAndAfterConstraints() throws IOException {
        List<String> itemConstraint = Arrays.asList("f", "g");
        double minimumConfidence = 0.5;
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

        String[] expectedOutput = { "f -1 #CONF: 1.0 #SUP: 8", "g -1 #CONF: 1.0 #SUP: 8",
                "a f g h -1 #CONF: 1.0 #SUP: 3" };

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, sequences, null);
        System.out.println(result);

        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testFreuqentItemConstraintsPatterns() throws IOException {
        List<String> itemConstraint = Arrays.asList("f", "g", "h");
        double minimumConfidence = 0.5;
        String[] sequences = {
                "f -1",
                "f -1",
                "f g h -1",
                "f g h -1",
                "f g h -1",
                "f g h -1",
                "f g h -1",
                "a f g -1",
                "a f g -1",
                "a f g -1",
                "a f g -1",
                "a f g -1",
                "a f g -1",
                "a f g -1",
                "g -1",
                "g -1",
        };

        String[] expectedOutput = { "f -1 #CONF: 1.0 #SUP: 14", "g -1 #CONF: 1.0 #SUP: 14", "f g h -1 #CONF: 1 #SUP: 5",
                "a f g -1 #CONF: 0.6666666666666666 #SUP: 4" };

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, sequences, null);
        System.out.println(result);

        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testFreuqentItemConstraintsPatternsIncludedInOthers_NonConstraintsBefore() throws IOException {
        List<String> itemConstraint = Arrays.asList("f", "g", "h");
        double minimumConfidence = 0.5;
        String[] sequences = {
                "f -1",
                "f -1",
                "f g h -1",
                "f g h -1",
                "f g h -1",
                "f g h -1",
                "f g h -1",
                "a f g h -1",
                "a f g h -1",
                "a f g h -1",
                "a f g h -1",
                "a f g h -1",
                "a f g h -1",
                "a f g h -1",
                "g -1",
                "g -1",
        };

        String[] expectedOutput = { "f -1 #CONF: 1.0 #SUP: 14", "g -1 #CONF: 1.0 #SUP: 14",
                "f g h -1 #CONF: 1 #SUP: 12", "a f g h -1 #CONF: 0.714285714285714 #SUP: 7" };

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, sequences, null);
        System.out.println(result);

        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testFreuqentItemConstraintsPatternsIncludedInOthers_NonConstraintsAfter() throws IOException {
        List<String> itemConstraint = Arrays.asList("f", "g", "h");
        double minimumConfidence = 0.5;
        String[] sequences = {
                "f -1",
                "f -1",
                "f g h -1",
                "f g h -1",
                "f g h -1",
                "f g h -1",
                "f g h -1",
                "f g h i -1",
                "f g h i -1",
                "f g h i -1",
                "f g h i -1",
                "f g h i -1",
                "f g h i -1",
                "f g h i -1",
                "g -1",
                "g -1",
        };

        String[] expectedOutput = { "f -1 #CONF: 1.0 #SUP: 14", "g -1 #CONF: 1.0 #SUP: 14",
                "f g h -1 #CONF: 1 #SUP: 12", "f g h i -1 #CONF: 0.714285714285714 #SUP: 7" };

        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, sequences, null);
        System.out.println(result);

        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void testReptitivePattern() throws IOException {
        List<String> itemConstraint = Arrays.asList("f");
        double minimumConfidence = 0.5;
        String[] sequences = { "a b c f g -1", "a b c f g -1",
                "a b c f g -1", "a b c f g -1" };

        String[] expectedOutput = { "a b c f g -1 #CONF: 1.0 #SUP: 4" };
        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, sequences, null);
        assertArrayEquals(expectedOutput, result.toArray());
    }

    @Test
    void unSortedSequences() throws IOException {
        List<String> itemConstraint = Arrays.asList("f");
        double minimumConfidence = 0.5;
        String[] sequences = { "a b c g f -1", "a b c f g -1",
                "a b c g f -1" };
        String[] expectedOutput = { "a b c f -1 #CONF: 1.0 #SUP: 3" };
        List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, sequences, null);
        assertArrayEquals(expectedOutput, result.toArray());

    }
}
