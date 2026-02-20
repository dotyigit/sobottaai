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
    fn removes_common_fillers() {
        let input = "So um I was like thinking about uh the project";
        let result = remove_fillers(input);
        assert_eq!(result, "I was thinking about the project");
    }

    #[test]
    fn removes_um_uh_uhm_er_ah() {
        assert_eq!(remove_fillers("um hello"), "hello");
        assert_eq!(remove_fillers("hello uh world"), "hello world");
        assert_eq!(remove_fillers("uhm yes"), "yes");
        assert_eq!(remove_fillers("er I think"), "I think");
        assert_eq!(remove_fillers("ah okay"), "okay");
    }

    #[test]
    fn removes_discourse_markers() {
        assert_eq!(
            remove_fillers("basically I need this"),
            "I need this"
        );
        assert_eq!(
            remove_fillers("actually it works"),
            "it works"
        );
        assert_eq!(
            remove_fillers("literally the best"),
            "the best"
        );
    }

    #[test]
    fn removes_multi_word_fillers() {
        assert_eq!(
            remove_fillers("you know it is good"),
            "it is good"
        );
        assert_eq!(
            remove_fillers("I mean we should go"),
            "we should go"
        );
    }

    #[test]
    fn case_insensitive() {
        assert_eq!(remove_fillers("UM hello"), "hello");
        assert_eq!(remove_fillers("Like cool"), "cool");
        assert_eq!(remove_fillers("BASICALLY yes"), "yes");
    }

    #[test]
    fn collapses_multiple_spaces() {
        let input = "so  um  like  I  think";
        let result = remove_fillers(input);
        assert_eq!(result, "I think");
    }

    #[test]
    fn no_fillers_unchanged() {
        let input = "This is a perfectly normal sentence";
        assert_eq!(remove_fillers(input), input);
    }

    #[test]
    fn empty_input() {
        assert_eq!(remove_fillers(""), "");
    }

    #[test]
    fn only_fillers_returns_empty() {
        let input = "um uh like so";
        assert_eq!(remove_fillers(input), "");
    }

    #[test]
    fn preserves_words_containing_filler_substrings() {
        // "like" in "likelihood" should not be removed (word boundary)
        let input = "the likelihood is high";
        assert_eq!(remove_fillers(input), "the likelihood is high");
    }
}
