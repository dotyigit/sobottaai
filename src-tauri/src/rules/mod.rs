pub mod filler;
pub mod punctuation;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rule {
    pub id: String,
    pub name: String,
    pub rule_type: RuleType,
    pub enabled: bool,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RuleType {
    RegexReplace {
        pattern: String,
        replacement: String,
    },
}

pub fn builtin_rules() -> Vec<Rule> {
    vec![
        Rule {
            id: "remove-fillers".into(),
            name: "Remove Filler Words".into(),
            rule_type: RuleType::RegexReplace {
                pattern: filler::FILLER_PATTERN.into(),
                replacement: "".into(),
            },
            enabled: false,
            sort_order: 0,
        },
        Rule {
            id: "smart-punctuation".into(),
            name: "Smart Punctuation".into(),
            rule_type: RuleType::RegexReplace {
                pattern: String::new(),
                replacement: String::new(),
            },
            enabled: false,
            sort_order: 1,
        },
    ]
}

/// Apply a chain of enabled rules in order.
pub fn apply_regex_rules(text: &str, rules: &[Rule]) -> String {
    let mut result = text.to_string();

    for rule in rules.iter().filter(|r| r.enabled) {
        match &rule.rule_type {
            RuleType::RegexReplace { .. } if rule.id == "remove-fillers" => {
                result = filler::remove_fillers(&result);
            }
            RuleType::RegexReplace { .. } if rule.id == "smart-punctuation" => {
                result = punctuation::fix_punctuation(&result);
            }
            RuleType::RegexReplace {
                pattern,
                replacement,
            } => {
                if let Ok(re) = regex::Regex::new(pattern) {
                    result = re.replace_all(&result, replacement.as_str()).to_string();
                }
            }
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builtin_rules_returns_two_rules() {
        let rules = builtin_rules();
        assert_eq!(rules.len(), 2);
    }

    #[test]
    fn builtin_rules_all_disabled_by_default() {
        let rules = builtin_rules();
        for rule in &rules {
            assert!(!rule.enabled, "Rule '{}' should be disabled by default", rule.name);
        }
    }

    #[test]
    fn builtin_rules_have_correct_ids() {
        let rules = builtin_rules();
        assert_eq!(rules[0].id, "remove-fillers");
        assert_eq!(rules[1].id, "smart-punctuation");
    }

    #[test]
    fn builtin_rules_sorted_by_sort_order() {
        let rules = builtin_rules();
        for i in 1..rules.len() {
            assert!(
                rules[i].sort_order > rules[i - 1].sort_order,
                "Rules should be sorted by sort_order"
            );
        }
    }

    #[test]
    fn apply_regex_rules_no_rules_enabled() {
        let text = "um hello like world";
        let rules = builtin_rules(); // all disabled
        let result = apply_regex_rules(text, &rules);
        assert_eq!(result, text); // no change
    }

    #[test]
    fn apply_regex_rules_filler_removal() {
        let text = "um hello like world";
        let mut rules = builtin_rules();
        rules[0].enabled = true; // enable "remove-fillers"
        let result = apply_regex_rules(text, &rules);
        assert_eq!(result, "hello world");
    }

    #[test]
    fn apply_regex_rules_punctuation() {
        let text = "hello world. this is a test";
        let mut rules = builtin_rules();
        rules[1].enabled = true; // enable "smart-punctuation"
        let result = apply_regex_rules(text, &rules);
        assert_eq!(result, "Hello world. This is a test.");
    }

    #[test]
    fn apply_regex_rules_chained_filler_then_punctuation() {
        let text = "um hello world. like this is a test";
        let mut rules = builtin_rules();
        rules[0].enabled = true; // fillers
        rules[1].enabled = true; // punctuation
        let result = apply_regex_rules(text, &rules);
        assert_eq!(result, "Hello world. This is a test.");
    }

    #[test]
    fn apply_regex_rules_custom_regex_rule() {
        let text = "foo bar baz";
        let rules = vec![Rule {
            id: "custom-test".into(),
            name: "Replace foo".into(),
            rule_type: RuleType::RegexReplace {
                pattern: r"foo".into(),
                replacement: "qux".into(),
            },
            enabled: true,
            sort_order: 0,
        }];
        let result = apply_regex_rules(text, &rules);
        assert_eq!(result, "qux bar baz");
    }

    #[test]
    fn apply_regex_rules_invalid_regex_is_skipped() {
        let text = "hello world";
        let rules = vec![Rule {
            id: "bad-regex".into(),
            name: "Invalid".into(),
            rule_type: RuleType::RegexReplace {
                pattern: r"[invalid".into(), // invalid regex
                replacement: "x".into(),
            },
            enabled: true,
            sort_order: 0,
        }];
        let result = apply_regex_rules(text, &rules);
        assert_eq!(result, text); // gracefully skipped
    }
}
