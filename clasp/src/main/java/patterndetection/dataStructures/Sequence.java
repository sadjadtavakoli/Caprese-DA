package patterndetection.dataStructures;

import java.util.ArrayList;
import java.util.List;

/**
 * Inspired in SPMF Implementation of a sequence. A sequence is defined as a
 * list of items and can have an identifier.
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
public class Sequence {

    /**
     * List of items that compose the sequence.
     */
    private List<Item> items = new ArrayList<>();
    /**
     * Sequence identifier
     */
    private int id;

    /**
     * Standard constructor for a sequence
     * 
     * @param id The sequence identifier
     */
    public Sequence(int id) {
        this.id = id;
    }


    /**
     * It adds an item to the sequence. The item is inserted in the last position.
     * 
     * @param value The item to add
     */
    public void addItem(Item value) {
        items.add(value);
    }

    /**
     * It removes the item which appears in the specified index.
     * 
     * @param i the index
     * @return the removed item
     */
    public Item removeItem(int i) {
        return items.remove(i);
    }

/**
     * It returns the list of items that compose the sequence.
     * 
     * @return the list of items
     */
    public List<Item> getItems() {
        return items;
    }

    /**
     * It returns the item from the specified position.
     * 
     * @param index The index where is the item in which we are interested.
     * @return the item
     */
    public Item get(int index) {
        return items.get(index);
    }

    /**
     * It returns the number of items that compose the sequence.
     * 
     * @return the number of items
     */
    public int size() {
        return items.size();
    }
    /**
     * Get the string representation of this sequence
     * 
     * @return the string representation
     */
    @Override
    public String toString() {
        StringBuilder r = new StringBuilder("");
        r.append("{");
        for (Item item : items) {
            String string = item.toString();
            r.append(string);
            r.append(' ');
        }
        r.append('}');
        return r.append("    ").toString();
    }

    /**
     * It returns the sequence ID
     * 
     * @return the sequence id of this sequence
     */
    public int getId() {
        return id;
    }

    /**
     * Set the sequence id of this sequence
     * 
     * @param id the sequence id
     */
    public void setID(int id) {
        this.id = id;
    }

}