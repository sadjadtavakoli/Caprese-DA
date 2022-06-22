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
                                "a c d f -1",
                                "a b g -1",
                                "e f g -1",
                                "e f g -1"
                };

                String[] expectedOutput = { "e f g -1 #CONF: 0.6666666666666666 #SUP: 2" };

                List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, minimumConfidence, sequences, null);
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

                String[] expectedOutput = { "e f g -1 #CONF: 0.6666666666666666 #SUP: 2" };

                List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, minimumConfidence, sequences, null);
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

                List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, minimumConfidence, sequences, null);
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

                List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, minimumConfidence, sequences, null);
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
                // String[] expectedOutput = { "a g -1 #CONF: 3.0 #SUP: 3", "e f -1 #CONF: 1.0
                // #SUP: 1",
                // "e g -1 #CONF: 2.0 #SUP: 2", "a b c -1 #CONF: 1.0 #SUP: 1",
                // "a b g -1 #CONF: 2.0 #SUP: 2", "a c g -1 #CONF: 2.0 #SUP: 2",
                // "a d g -1 #CONF: 1.0 #SUP: 1", "a e g -1 #CONF: 1.0 #SUP: 1" };
                String[] expectedOutput = {};
                List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, minimumConfidence, sequences, null);
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

                String[] expectedOutput = {"a b -1 #CONF: 1.0 #SUP: 2", "b c -1 #CONF: 1.0 #SUP: 1"};

                List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, minimumConfidence, sequences, null);
                System.out.println(result);

                assertArrayEquals(expectedOutput, result.toArray());
        }

        @Test
        void testNonFrequentPairsCoOccurranceBeforeConstraints() throws IOException {
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

                String[] expectedOutput = { "a f g -1 #CONF: 1.0 #SUP: 3" };

                List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, minimumConfidence, sequences, null);
                System.out.println(result);

                assertArrayEquals(expectedOutput, result.toArray());
        }

        @Test
        void testNonFrequentPairsCoOccurranceAfterConstraints() throws IOException {
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

                String[] expectedOutput = { "f g h -1 #CONF: 1.0 #SUP: 3" };

                List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, minimumConfidence, sequences, null);
                System.out.println(result);

                assertArrayEquals(expectedOutput, result.toArray());
        }

        @Test
        void testNonFrequentPairsCoOccurranceAfterAndAfterConstraints() throws IOException {
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

                String[] expectedOutput = { "a f g h -1 #CONF: 1.0 #SUP: 3" };

                List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, minimumConfidence, sequences, null);
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

                String[] expectedOutput = { "a f -1 #CONF: 0.5 #SUP: 7", "f g -1 #CONF: 1.0 #SUP: 12", "g h -1 #CONF: 1.0 #SUP: 5" };

                List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, minimumConfidence, sequences, null);
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

                String[] expectedOutput = { "a f -1 #CONF: 0.5 #SUP: 7", "f g -1 #CONF: 1.0 #SUP: 12", "g h -1 #CONF: 1.0 #SUP: 12" };

                List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, minimumConfidence, sequences, null);
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

                String[] expectedOutput = {"f g -1 #CONF: 1.0 #SUP: 12", "f h -1 #CONF: 1.0 #SUP: 12", "f i -1 #CONF: 0.5 #SUP: 7", "g h -1 #CONF: 1.0 #SUP: 12"};

                List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, minimumConfidence, sequences, null);
                System.out.println(result);

                assertArrayEquals(expectedOutput, result.toArray());
        }

        @Test
        void testStopSecondDetectedFunctionsFromExtension() throws IOException {
                List<String> itemConstraint = Arrays.asList("f", "h");
                double minimumConfidence = 0.5;
                String[] sequences = {
                                "f g h i -1",
                                "f g h i -1",
                                "f g h i -1",
                                "f g h i -1",
                                "h i j -1",
                                "h i j -1",
                                "h i j -1",
                                "h i j -1",
                                "h i j -1"
                };

                String[] expectedOutput = {"f g -1 #CONF: 1.0 #SUP: 4", "f h -1 #CONF: 1.0 #SUP: 4", "f i -1 #CONF: 1.0 #SUP: 4", "h j -1 #CONF: 0.5555555555555556 #SUP: 5" };
                List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, minimumConfidence, sequences, null);
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
                List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, minimumConfidence, sequences, null);
                assertArrayEquals(expectedOutput, result.toArray());
        }

        @Test
        void unSortedSequences() throws IOException {
                List<String> itemConstraint = Arrays.asList("f");
                double minimumConfidence = 0.5;
                String[] sequences = { "a b g c f -1", "a b c f g -1",
                                "a b c g f -1" };
                String[] expectedOutput = { "a b c f g -1 #CONF: 1.0 #SUP: 3" };
                List<String> result = AlgoCM_ClaSPExecutor.runList(itemConstraint, minimumConfidence, minimumConfidence, sequences, null);
                assertArrayEquals(expectedOutput, result.toArray());

        }
}
