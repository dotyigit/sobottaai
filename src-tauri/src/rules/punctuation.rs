use once_cell::sync::Lazy;
use regex::Regex;

static SENTENCE_CAP: Lazy<Regex> = Lazy::new(|| Regex::new(r"([.!?]\s+)(\w)").unwrap());

pub fn fix_punctuation(text: &str) -> String {
    let mut result = text.to_string();

    // Ensure sentence-ending punctuation
    let trimmed = result.trim_end();
    if !trimmed.ends_with('.') && !trimmed.ends_with('!') && !trimmed.ends_with('?') {
        result = format!("{}.", trimmed);
    }

    // Capitalize first letter of each sentence
    result = SENTENCE_CAP
        .replace_all(&result, |caps: &regex::Captures| {
            format!(
                "{}{}",
                &caps[1],
                caps[2].to_uppercase()
            )
        })
        .to_string();

    // Capitalize first character
    let mut chars = result.chars();
    if let Some(first) = chars.next() {
        result = format!("{}{}", first.to_uppercase(), chars.as_str());
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adds_period_if_missing() {
        assert_eq!(fix_punctuation("hello world"), "Hello world.");
    }

    #[test]
    fn no_double_period() {
        assert_eq!(fix_punctuation("hello world."), "Hello world.");
    }

    #[test]
    fn preserves_exclamation() {
        assert_eq!(fix_punctuation("hello world!"), "Hello world!");
    }

    #[test]
    fn preserves_question_mark() {
        assert_eq!(fix_punctuation("is this working?"), "Is this working?");
    }

    #[test]
    fn capitalizes_first_character() {
        assert_eq!(fix_punctuation("hello"), "Hello.");
    }

    #[test]
    fn capitalizes_after_period() {
        let input = "hello world. this is a test";
        assert_eq!(fix_punctuation(input), "Hello world. This is a test.");
    }

    #[test]
    fn capitalizes_after_exclamation() {
        let input = "wow! that is great";
        assert_eq!(fix_punctuation(input), "Wow! That is great.");
    }

    #[test]
    fn capitalizes_after_question_mark() {
        let input = "really? yes indeed";
        assert_eq!(fix_punctuation(input), "Really? Yes indeed.");
    }

    #[test]
    fn multiple_sentences() {
        let input = "first. second. third";
        assert_eq!(fix_punctuation(input), "First. Second. Third.");
    }

    #[test]
    fn already_correct_unchanged() {
        let input = "Hello world. This is fine.";
        assert_eq!(fix_punctuation(input), input);
    }

    #[test]
    fn single_word() {
        assert_eq!(fix_punctuation("hello"), "Hello.");
    }

    #[test]
    fn handles_trailing_whitespace() {
        assert_eq!(fix_punctuation("hello   "), "Hello.");
    }
}
