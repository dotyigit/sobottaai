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
    fn test_fix_punctuation() {
        let input = "hello world. this is a test";
        let result = fix_punctuation(input);
        assert_eq!(result, "Hello world. This is a test.");
    }
}
