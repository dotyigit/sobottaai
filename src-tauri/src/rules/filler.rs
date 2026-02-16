use once_cell::sync::Lazy;
use regex::Regex;

pub const FILLER_PATTERN: &str =
    r"(?i)\b(um|uh|uhm|er|ah|like|you know|I mean|so|basically|actually|literally|right)\b\s*";

static FILLER_RE: Lazy<Regex> = Lazy::new(|| Regex::new(FILLER_PATTERN).unwrap());

static MULTI_SPACE: Lazy<Regex> = Lazy::new(|| Regex::new(r"\s{2,}").unwrap());

pub fn remove_fillers(text: &str) -> String {
    let result = FILLER_RE.replace_all(text, "");
    MULTI_SPACE.replace_all(&result, " ").trim().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_remove_fillers() {
        let input = "So um I was like thinking about uh the project";
        let result = remove_fillers(input);
        assert_eq!(result, "I was thinking about the project");
    }
}
