package clasp_AGP.savers;

import java.util.Map;
import java.util.Map.Entry;

import clasp_AGP.dataStructures.ImpactInformation;
import clasp_AGP.dataStructures.patterns.Pattern;

/**
 * This is the definition of a interface in order to decide where the user wants
 * to keep the patterns. The implementer classes will refer to the place for
 * keeping them
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
public interface Saver {

    public void savePattern(Pattern p);

    public void saveImpactedFunctions(Entry<String, ImpactInformation> impactedFunction);
    
    public void finish();

    public void clear();

    public String print();

    public Map<String, ImpactInformation> getList();
    
}