package refdiff.core.cst;

import java.util.Objects;

public class Location {
	private String file;
	private int begin;
	private int end;
	private int line;
	private int endLine;
	private String position;
	private int bodyBegin;
	private int bodyEnd;
	
	public Location() {}
	
	public Location(String file, int begin, int end, int line, int bodyBegin, int bodyEnd) {
		this.file = file;
		this.begin = begin;
		this.end = end;
		this.line = line;
		this.bodyBegin = bodyBegin;
		this.bodyEnd = bodyEnd;
	}
	
	public Location(String file, int begin, int end, int line) {
		this(file, begin, end, line, begin, end);
	}
	
	public Location(String file, int begin, int end, Position position, int endLine, int bodyBegin, int bodyEnd) {
		this.file = file;
		this.begin = begin;
		this.end = end;
		this.line = position.getLine();
		this.endLine = endLine;
		this.position = position.toString();
		this.bodyBegin = bodyBegin;
		this.bodyEnd = bodyEnd;
	}
		
	public static Location of(String file, int begin, int end, int bodyBegin, int bodyEnd, CharSequence fileContent) {
		Position position = findLineNumberAndPosition(begin, fileContent);
		int endLine = findLineNumber(end, fileContent);
		return new Location(file, begin, end, position, endLine, bodyBegin, bodyEnd);
	}

	public static int findLineNumber(int begin, CharSequence fileContent) {
		int count = 0;
		for (int i = 0; i < begin; i++) {
			if (fileContent.charAt(i) == '\n') {
				count++; // YOU CAN COMPUTE CHARACTER POSITION AT EACH LINE BY CHANGIN THIS METHOD OR CREATING A NEW ONE
			}
		}
		return count + 1;
	}

	public static Position findLineNumberAndPosition(int begin, CharSequence fileContent) {
		int count = 0;
		int position = 0;
		for (int i = 0; i < begin; i++) {
			position++;
			if (fileContent.charAt(i) == '\n') {
				count++;
				position = 0;
			}
		}
		return new Position(count + 1, position);
	}


	public String getFile() {
		return file;
	}

	public void setFile(String file) {
		this.file = file;
	}

	public int getBegin() {
		return begin;
	}

	public void setBegin(int begin) {
		this.begin = begin;
	}

	public int getEnd() {
		return end;
	}

	public void setEnd(int end) {
		this.end = end;
	}

	public int getBodyBegin() {
		return bodyBegin;
	}

	public void setBodyBegin(int bodyBegin) {
		this.bodyBegin = bodyBegin;
	}

	public int getBodyEnd() {
		return bodyEnd;
	}

	public void setBodyEnd(int bodyEnd) {
		this.bodyEnd = bodyEnd;
	}

	@Override
	public boolean equals(Object obj) {
		if (obj instanceof Location) {
			Location otherLocation = (Location) obj;
			return 
				Objects.equals(this.file, otherLocation.file) &&
				Objects.equals(this.begin, otherLocation.begin) &&
				Objects.equals(this.end, otherLocation.end) &&
				Objects.equals(this.bodyBegin, otherLocation.bodyBegin) &&
				Objects.equals(this.bodyEnd, otherLocation.bodyEnd);
		}
		return false;
	}
	
	@Override
	public int hashCode() {
		return Objects.hash(this.file, this.begin, this.end, this.bodyBegin, this.bodyEnd);
	}
	
	@Override
	public String toString() {
		return String.format("%s:%d:%d:%d:%d", file, begin, end, bodyBegin, bodyEnd);
	}

	public String format() {
		return String.format("%s:%d", file, line);
	}

	public int getLine() {
		return line;
	}

	public int getEndLine() {
		return endLine;
	}

	public String getPosition() {
		return position;
	}

	public void setLine(int line) {
		this.line = line;
	}
	
}
