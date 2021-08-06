package refdiff.core.cst;

public class Position {
	private int character;
	private int line;
	
	public Position(int line, int character) {
		this.line = line;
		this.character = character;
	}

	public int getCharacter() {
		return character;
	}

	public int getLine() {
		return line;
	}

	public String toString(){
		return String.valueOf(line) + String.valueOf(character);
	}
}
