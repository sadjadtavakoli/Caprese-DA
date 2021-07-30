package refdiff.core.cst;

import java.util.Comparator;

public class CstNodeTypeComprator implements Comparator<CstNode>{
    
    @Override
    public int compare(CstNode n1, CstNode n2) {

        Integer n1Line = n1.getLine();
        Integer n1EndLine = n1.getEndLine();
        Integer n2Line = n2.getLine();
        Integer n2EndLine = n2.getEndLine();

        return (n1Line < n2Line && n1EndLine > n2EndLine) ? 1 : -1;
    }
}