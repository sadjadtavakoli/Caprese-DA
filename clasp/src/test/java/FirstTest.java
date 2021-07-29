import org.junit.jupiter.api.Test;

import clasp_AGP.AlgoCM_ClaSPExecutor;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * Unit test for simple App.
 */
class FirstTest {

    List<String> itemConstraint = Arrays.asList("6", "7", "8");
    String sequences = "1 -1 6 1 2 3 -1 1 3 -1 4 -1 3 -1 -2\n1 4 -1 3 -1 2 3 -1 1 5 -1 -2\n5 6 -1 1 2 -1 4 -1 3 -1 2 -1 -2\n5 -1 7 -1 1 6 -1 3 -1 2 -1 3 -1 -2";

    @Test
    void testApp() throws IOException {
        AlgoCM_ClaSPExecutor.runString(itemConstraint, 0.5, sequences, null);
        for (int i = 0; i <= itemConstraint.size(); i++) {
            assertEquals(1, i);
        }
    }
}
