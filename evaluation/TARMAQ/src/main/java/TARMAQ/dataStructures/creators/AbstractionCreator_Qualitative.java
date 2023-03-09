package TARMAQ.dataStructures.creators;

import TARMAQ.dataStructures.abstracciones.Abstraction_Generic;
import TARMAQ.dataStructures.abstracciones.Abstraction_Qualitative;

/**
 * Class that implements a qualitative abstraction. Two different values are
 * possible: to be with an equal relation with respect to a previous pair (if
 * occurs at the same time), or to be with an after relation with respect to
 * that previous pair (the previous pair have a before relation with respect to
 * this one)
 *
 * Copyright Antonio Gomariz Peñalver 2013
 *
 * This file is part of the SPMF DATA MINING SOFTWARE
 * (http://www.philippe-fournier-viger.com/spmf).
 *
 * SPMF is free software: you can redistribute it and/or modify it under the
 * terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * SPMF is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * If not, see <http://www.gnu.org/licenses/>.
 *
 * @author agomariz
 */
public class AbstractionCreator_Qualitative extends AbstractionCreator {

    private static AbstractionCreator_Qualitative instance = null;

    public static void sclear() {
        instance = null;
    }

    private AbstractionCreator_Qualitative() {
    }

    public static AbstractionCreator_Qualitative getInstance() {
        if (instance == null) {
            instance = new AbstractionCreator_Qualitative();
        }
        return instance;
    }

    /**
     * It creates a default abstraction. The abstraction is established to false
     * 
     * @return the abstraction
     */
    @Override
    public Abstraction_Generic createDefaultAbstraction() {
        return Abstraction_Qualitative.create(false);
    }

    /**
     * It creates a relation with the given parameter.
     * 
     * @param hasEqualRelation The boolean indicatin if the item has an equal
     *                         relation with the previous item in the pattern
     * @return the created relation
     */
    public Abstraction_Generic crearAbstraccion(boolean hasEqualRelation) {
        return Abstraction_Qualitative.create(hasEqualRelation);
    }


    @Override
    public void clear() {
    }

    /**
     * It increase the position of a given position by 1.
     * 
     * @param beginning the position
     * @return the position +1
     */
    public Integer increasePosition(Integer beginning) {
        return beginning + 1;
    }
}
