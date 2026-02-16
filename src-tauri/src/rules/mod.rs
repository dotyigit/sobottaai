pub mod filler;
pub mod grammar;
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
    LlmBased {
        system_prompt: String,
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
        Rule {
            id: "fix-grammar".into(),
            name: "Fix Grammar".into(),
            rule_type: RuleType::LlmBased {
                system_prompt: grammar::GRAMMAR_SYSTEM_PROMPT.into(),
            },
            enabled: false,
            sort_order: 2,
        },
    ]
}

/// Apply a chain of enabled rules in order.
pub fn apply_regex_rules(text: &str, rules: &[Rule]) -> String {
    let mut result = text.to_string();

    for rule in rules.iter().filter(|r| r.enabled) {
        match &rule.rule_type {
            RuleType::RegexReplace { pattern, .. } if rule.id == "remove-fillers" => {
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
            RuleType::LlmBased { .. } => {
                // LLM-based rules are handled separately via async LLM calls
            }
        }
    }

    result
}
