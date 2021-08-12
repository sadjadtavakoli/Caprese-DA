package refdiff.core.io;

import java.util.Collections;
import java.util.List;

public class FilePathFilter {
	private final List<String> allowedFileExtensions;
	private final List<String> excludedFileExtensions;
	private final List<String> allowedToBeTokenizedFileExtensions;
	
	public FilePathFilter(List<String> allowedFileExtensions) {
		this(allowedFileExtensions, Collections.emptyList());
	}
	
	public FilePathFilter(List<String> allowedFileExtensions, List<String> excludedFileExtensions) {
		this.allowedFileExtensions = allowedFileExtensions;
		this.excludedFileExtensions = excludedFileExtensions;
		this.allowedToBeTokenizedFileExtensions = allowedFileExtensions;
	}

	public FilePathFilter(List<String> allowedFileExtensions, List<String> allowedToBeTokenizedFileExtensions, List<String> excludedFileExtensions) {
		this.allowedFileExtensions = allowedFileExtensions;
		this.excludedFileExtensions = excludedFileExtensions;
		this.allowedToBeTokenizedFileExtensions = allowedToBeTokenizedFileExtensions;
	}
	
	public boolean isAllowed(String filePath) {
		for (String fileExtension : excludedFileExtensions) {
			if (filePath.endsWith(fileExtension)) {
				return false;
			}
		}
		for (String fileExtension : allowedFileExtensions) {
			if (filePath.endsWith(fileExtension)) {
				return true;
			}
		}
		return false;
	}

	public boolean isAllowedToBeTokenized(String filePath) {
		for (String fileExtension : excludedFileExtensions) {
			if (filePath.endsWith(fileExtension)) {
				return false;
			}
		}
		for (String fileExtension : allowedToBeTokenizedFileExtensions) {
			if (filePath.endsWith(fileExtension)) {
				return true;
			}
		}
		return false;
	}
}
