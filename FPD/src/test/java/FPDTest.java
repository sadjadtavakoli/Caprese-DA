import org.junit.jupiter.api.Test;

import patterndetection.MainAlgorithm;
import patterndetection.dataStructures.ImpactInformation;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

/**
 * Unit test for simple App.
 */
public class FPDTest {

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


                Map<String, ImpactInformation> result = MainAlgorithm.runList(itemConstraint, minimumConfidence, sequences, null);
                
                Map<String, Object[]> expectedValues = new HashMap<>();
                Object[] values = {0.6666666666666666, 2, "[[\"f\"]]"};
                expectedValues.put("e", values);
                expectedValues.put("g", values);

                assertEquals(expectedValues.size(), result.size());
                assertArrayEquals(expectedValues.keySet().toArray(), result.keySet().toArray());

                for(Entry<String, Object[]> expectedValue: expectedValues.entrySet()){
                        String key = expectedValue.getKey();
                        Object[] value = expectedValue.getValue();
                        assertEquals(value[0], result.get(key).getConfidence());
                        assertEquals(value[1], result.get(key).getSupport());
                        assertEquals(value[2], result.get(key).getAntecedents().toString());                        
                }
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

                Map<String, ImpactInformation> result = MainAlgorithm.runList(itemConstraint, minimumConfidence, sequences, null);
                
                Map<String, Object[]> expectedValues = new HashMap<>();
                Object[] values = {0.6666666666666666, 2, "[[\"f\"]]"};
                expectedValues.put("e", values);
                expectedValues.put("g", values);

                assertEquals(expectedValues.size(), result.size());
                assertArrayEquals(expectedValues.keySet().toArray(), result.keySet().toArray());

                for(Entry<String, Object[]> expectedValue: expectedValues.entrySet()){
                        String key = expectedValue.getKey();
                        Object[] value = expectedValue.getValue();
                        assertEquals(value[0], result.get(key).getConfidence());
                        assertEquals(value[1], result.get(key).getSupport());
                        assertEquals(value[2], result.get(key).getAntecedents().toString());                        
                }
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

                Map<String, ImpactInformation> result = MainAlgorithm.runList(itemConstraint, minimumConfidence, sequences, null);
                
                Map<String, Object[]> expectedValues = new HashMap<>();
                Object[] values = {1.0, 1, "[[\"f\"]]"};
                expectedValues.put("e", values);
                expectedValues.put("g", values);

                assertEquals(expectedValues.size(), result.size());
                assertArrayEquals(expectedValues.keySet().toArray(), result.keySet().toArray());

                for(Entry<String, Object[]> expectedValue: expectedValues.entrySet()){
                        String key = expectedValue.getKey();
                        Object[] value = expectedValue.getValue();
                        assertEquals(value[0], result.get(key).getConfidence());
                        assertEquals(value[1], result.get(key).getSupport());
                        assertEquals(value[2], result.get(key).getAntecedents().toString());                        
                }
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

                int expectedSize = 0;
                Map<String, ImpactInformation> result = MainAlgorithm.runList(itemConstraint, minimumConfidence, sequences, null);

                assertEquals(expectedSize, result.size());
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

                Integer expectedSize = 0;

                Map<String, ImpactInformation> result = MainAlgorithm.runList(itemConstraint, minimumConfidence, sequences, null);
                System.out.println(result);
                assertEquals(expectedSize, result.size());
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

                Integer expectedSize = 0;

                Map<String, ImpactInformation> result = MainAlgorithm.runList(itemConstraint, minimumConfidence, sequences, null);

                assertEquals(expectedSize, result.size());
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

                Map<String, ImpactInformation> result = MainAlgorithm.runList(itemConstraint, minimumConfidence, sequences, null);

                Map<String, Object[]> expectedValues = new HashMap<>();
                Object[] values = {1.0, 3, "[[\"f\", \"g\"]]"};
                expectedValues.put("a", values);

                assertEquals(expectedValues.size(), result.size());
                assertArrayEquals(expectedValues.keySet().toArray(), result.keySet().toArray());

                for(Entry<String, Object[]> expectedValue: expectedValues.entrySet()){
                        String key = expectedValue.getKey();
                        Object[] value = expectedValue.getValue();
                        assertEquals(value[0], result.get(key).getConfidence());
                        assertEquals(value[1], result.get(key).getSupport());
                        assertEquals(value[2], result.get(key).getAntecedents().toString());                        
                }

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

                Map<String, ImpactInformation> result = MainAlgorithm.runList(itemConstraint, minimumConfidence, sequences, null);

                Map<String, Object[]> expectedValues = new HashMap<>();
                Object[] values = {1.0, 3, "[[\"f\", \"g\"]]"};
                expectedValues.put("h", values);

                assertEquals(expectedValues.size(), result.size());
                assertArrayEquals(expectedValues.keySet().toArray(), result.keySet().toArray());

                for(Entry<String, Object[]> expectedValue: expectedValues.entrySet()){
                        String key = expectedValue.getKey();
                        Object[] value = expectedValue.getValue();
                        assertEquals(value[0], result.get(key).getConfidence());
                        assertEquals(value[1], result.get(key).getSupport());
                        assertEquals(value[2], result.get(key).getAntecedents().toString());                        
                }

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

                Map<String, ImpactInformation> result = MainAlgorithm.runList(itemConstraint, minimumConfidence, sequences, null);

                Map<String, Object[]> expectedValues = new HashMap<>();
                Object[] values = {1.0, 3, "[[\"f\", \"g\"]]"};
                expectedValues.put("a", values);
                expectedValues.put("h", values);

                assertEquals(expectedValues.size(), result.size());
                assertArrayEquals(expectedValues.keySet().toArray(), result.keySet().toArray());

                for(Entry<String, Object[]> expectedValue: expectedValues.entrySet()){
                        String key = expectedValue.getKey();
                        Object[] value = expectedValue.getValue();
                        assertEquals(value[0], result.get(key).getConfidence());
                        assertEquals(value[1], result.get(key).getSupport());
                        assertEquals(value[2], result.get(key).getAntecedents().toString());                        
                }
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

                Map<String, ImpactInformation> result = MainAlgorithm.runList(itemConstraint, minimumConfidence, sequences, null);

                Map<String, Object[]> expectedValues = new HashMap<>();
                Object[] values = {0.5, 7, "[[\"f\"]]"};
                expectedValues.put("a", values);

                assertEquals(expectedValues.size(), result.size());
                assertArrayEquals(expectedValues.keySet().toArray(), result.keySet().toArray());

                for(Entry<String, Object[]> expectedValue: expectedValues.entrySet()){
                        String key = expectedValue.getKey();
                        Object[] value = expectedValue.getValue();
                        assertEquals(value[0], result.get(key).getConfidence());
                        assertEquals(value[1], result.get(key).getSupport());
                        assertEquals(value[2], result.get(key).getAntecedents().toString());                        
                }       
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

                Map<String, ImpactInformation> result = MainAlgorithm.runList(itemConstraint, minimumConfidence, sequences, null);

                Map<String, Object[]> expectedValues = new HashMap<>();
                Object[] values = {0.5, 7, "[[\"f\"]]"};
                expectedValues.put("a", values);

                assertEquals(expectedValues.size(), result.size());
                assertArrayEquals(expectedValues.keySet().toArray(), result.keySet().toArray());

                for(Entry<String, Object[]> expectedValue: expectedValues.entrySet()){
                        String key = expectedValue.getKey();
                        Object[] value = expectedValue.getValue();
                        assertEquals(value[0], result.get(key).getConfidence());
                        assertEquals(value[1], result.get(key).getSupport());
                        assertEquals(value[2], result.get(key).getAntecedents().toString());                        
                } 
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

                Map<String, ImpactInformation> result = MainAlgorithm.runList(itemConstraint, minimumConfidence, sequences, null);

                Map<String, Object[]> expectedValues = new HashMap<>();
                Object[] values = {0.5, 7, "[[\"f\"]]"};
                expectedValues.put("i", values);

                assertEquals(expectedValues.size(), result.size());
                assertArrayEquals(expectedValues.keySet().toArray(), result.keySet().toArray());

                for(Entry<String, Object[]> expectedValue: expectedValues.entrySet()){
                        String key = expectedValue.getKey();
                        Object[] value = expectedValue.getValue();
                        assertEquals(value[0], result.get(key).getConfidence());
                        assertEquals(value[1], result.get(key).getSupport());
                        assertEquals(value[2], result.get(key).getAntecedents().toString());                        
                }
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


                Map<String, ImpactInformation> result = MainAlgorithm.runList(itemConstraint, minimumConfidence, sequences, null);

                Map<String, Object[]> expectedValues = new HashMap<>();
                Object[] values1 = {1.0, 4, "[[\"f\"]]"};
                Object[] values2 = {0.5555555555555556, 5, "[[\"h\"]]"};
                
                expectedValues.put("g", values1);
                expectedValues.put("i", values1);
                expectedValues.put("j", values2);

                assertEquals(expectedValues.size(), result.size());
                assertArrayEquals(expectedValues.keySet().toArray(), result.keySet().toArray());

                for(Entry<String, Object[]> expectedValue: expectedValues.entrySet()){
                        String key = expectedValue.getKey();
                        Object[] value = expectedValue.getValue();
                        assertEquals(value[0], result.get(key).getConfidence());
                        assertEquals(value[1], result.get(key).getSupport());
                        assertEquals(value[2], result.get(key).getAntecedents().toString());                        
                }
        }

        @Test
        void testOnlyFrequentFunctions() throws IOException {
                List<String> itemConstraint = Arrays.asList("f", "h");
                double minimumConfidence = 0.5;
                String[] sequences = {
                                "f g h i -1",
                                "f g h i -1",
                                "f g h i -1",
                                "f g h i -1",
                                "f h z -1",
                                "h i j -1",
                                "h i j -1",
                                "h i j -1",
                                "h i j -1",
                                "h i j -1"
                };


                Map<String, ImpactInformation> result = MainAlgorithm.runList(itemConstraint, minimumConfidence, sequences, null);

                Map<String, Object[]> expectedValues = new HashMap<>();
                Object[] values1 = {0.8, 4, "[[\"f\"]]"};
                Object[] values2 = {0.5, 5, "[[\"h\"]]"};
                
                expectedValues.put("g", values1);
                expectedValues.put("i", values1);
                expectedValues.put("j", values2);

                assertEquals(expectedValues.size(), result.size());
                assertArrayEquals(expectedValues.keySet().toArray(), result.keySet().toArray());

                for(Entry<String, Object[]> expectedValue: expectedValues.entrySet()){
                        String key = expectedValue.getKey();
                        Object[] value = expectedValue.getValue();
                        assertEquals(value[0], result.get(key).getConfidence());
                        assertEquals(value[1], result.get(key).getSupport());
                        assertEquals(value[2], result.get(key).getAntecedents().toString());                        
                }
        }

        @Test
        void testReptitivePattern() throws IOException {
                List<String> itemConstraint = Arrays.asList("f");
                double minimumConfidence = 0.5;
                String[] sequences = { "a b c f g -1", "a b c f g -1",
                                "a b c f g -1", "a b c f g -1" };

                Map<String, ImpactInformation> result = MainAlgorithm.runList(itemConstraint, minimumConfidence, sequences, null);

                Map<String, Object[]> expectedValues = new HashMap<>();
                Object[] values = {1.0, 4, "[[\"f\"]]"};
                
                expectedValues.put("a", values);
                expectedValues.put("b", values);
                expectedValues.put("c", values);
                expectedValues.put("g", values);

                assertEquals(expectedValues.size(), result.size());
                assertArrayEquals(expectedValues.keySet().toArray(), result.keySet().toArray());

                for(Entry<String, Object[]> expectedValue: expectedValues.entrySet()){
                        String key = expectedValue.getKey();
                        Object[] value = expectedValue.getValue();
                        assertEquals(value[0], result.get(key).getConfidence());
                        assertEquals(value[1], result.get(key).getSupport());
                        assertEquals(value[2], result.get(key).getAntecedents().toString());                        
                }        
        }

        @Test
        void unSortedSequences() throws IOException {
                List<String> itemConstraint = Arrays.asList("f");
                double minimumConfidence = 0.5;
                String[] sequences = { "a b g c f -1", "a b c f g -1",
                                "a b c g f -1" };

                Map<String, ImpactInformation> result = MainAlgorithm.runList(itemConstraint, minimumConfidence, sequences, null);

                Map<String, Object[]> expectedValues = new HashMap<>();
                Object[] values = {1.0, 3, "[[\"f\"]]"};
                
                expectedValues.put("a", values);
                expectedValues.put("b", values);
                expectedValues.put("c", values);
                expectedValues.put("g", values);

                assertEquals(expectedValues.size(), result.size());
                assertArrayEquals(expectedValues.keySet().toArray(), result.keySet().toArray());

                for(Entry<String, Object[]> expectedValue: expectedValues.entrySet()){
                        String key = expectedValue.getKey();
                        Object[] value = expectedValue.getValue();
                        assertEquals(value[0], result.get(key).getConfidence());
                        assertEquals(value[1], result.get(key).getSupport());
                        assertEquals(value[2], result.get(key).getAntecedents().toString());                        
                }  
        }
}
