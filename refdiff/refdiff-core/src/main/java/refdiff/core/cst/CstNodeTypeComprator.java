package refdiff.core.cst;

import java.util.Comparator;

public class CstNodeTypeComprator implements Comparator<CstNode>{
    
    @Override
    public int compare(CstNode n1, CstNode n2) {

        Integer n1Line = n1.getLine();
        Integer n2Line = n2.getLine();

        return n2Line.compareTo(n1Line);
    }
}