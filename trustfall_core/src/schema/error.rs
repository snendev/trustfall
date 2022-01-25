use serde::{ser::Error as SerError, Deserialize, Serialize, Serializer};

use crate::util::DisplayVec;

#[non_exhaustive]
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize, thiserror::Error)]
pub enum InvalidSchemaError {
    #[error("Multiple schema errors: {0}")]
    MultipleErrors(DisplayVec<InvalidSchemaError>),

    #[serde(
        skip_deserializing,
        serialize_with = "fail_serialize_schema_parse_error"
    )]
    #[error("Schema failed to parse.")]
    SchemaParseError(#[from] async_graphql_parser::Error),

    #[error(
        "Field \"{0}\" on type \"{1}\" comes from the implementation of interface \"{2}\" \
        but the field's type {3} is not compatible with the {4} type required by that interface. \
        The expected type for this field is the {4} type required by the interface, with optional \
        additional non-null constraints."
    )]
    InvalidTypeWideningOfInheritedField(String, String, String, String, String),

    #[error(
        "Field \"{0}\" on type \"{1}\" comes from the implementation of interface \"{2}\" \
        but the field's {3} parameter type {4} is not compatible with the {5} type required \
        by that interface. The expected type for this field parameter is the {5} type required by \
        the interface, optionally with non-null constraints removed if any are present."
    )]
    InvalidTypeNarrowingOfInheritedFieldParameter(String, String, String, String, String, String),

    #[error(
        "Field \"{0}\" on type \"{1}\" is missing parameter(s) that are required by \
        the implementation of interface \"{2}\" for this type: {3:?}"
    )]
    InheritedFieldMissingParameters(String, String, String, Vec<String>),

    #[error(
        "Field \"{0}\" on type \"{1}\" contains parameter(s) that are unexpected for \
        the implementation of interface \"{2}\" for this type: {3:?}"
    )]
    InheritedFieldUnexpectedParameters(String, String, String, Vec<String>),

    #[error(
        "The following types have a circular implementation relationship, \
        which is not allowed: {0:?}"
    )]
    CircularImplementsRelationships(Vec<String>),

    #[error(
        "Type \"{0}\" implements interface \"{1}\", but is missing field \"{2}\" of type {3} \
        which is required by that interface."
    )]
    MissingRequiredField(String, String, String, String),

    /// This may or may not be supported in the future.
    ///
    /// If supported, it will only be supported as an explicit opt-in,
    /// e.g. via an explicit directive on each type where a new ambiguity appears.
    #[error(
        "Type \"{0}\" defines field \"{1}\" of type {2}, but its origin is ambiguous because \
        multiple unrelated interfaces implemented by type \"{0}\" all define their own fields \
        by that name: {3:?}"
    )]
    AmbiguousFieldOrigin(String, String, String, Vec<String>),

    #[error(
        "Type \"{0}\" defines edge \"{1}\" of type {2}, which is not allowed. Edge types must be \
        vertex or list of vertex types, with optional nullability. Vertex types in two or more \
        nested lists are not supported."
    )]
    InvalidEdgeType(String, String, String),
}

impl From<Vec<InvalidSchemaError>> for InvalidSchemaError {
    fn from(v: Vec<InvalidSchemaError>) -> Self {
        assert!(!v.is_empty());
        if v.len() == 1 {
            v.into_iter().next().unwrap()
        } else {
            Self::MultipleErrors(DisplayVec(v))
        }
    }
}

fn fail_serialize_schema_parse_error<S: Serializer>(
    _: &async_graphql_parser::Error,
    _: S,
) -> Result<S::Ok, S::Error> {
    Err(S::Error::custom(
        "cannot serialize SchemaParseError error variant",
    ))
}
