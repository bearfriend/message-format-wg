# MessageFormat 2.0 Registry

The implementations and tooling can greatly benefit from a structured definition of formatting and matching functions available to messages at runtime. The _registry_ is a mechanism for storing such declarations. They are portable and can be used by tooling to type-check and lint messages at authoring time or buildtime.

## Data Model

The registry contains descriptions of function signatures. The following DTD describes the data model of a registry definition.

```xml
<!ELEMENT registry (function*) >

<!ELEMENT function (description, signature+) >
<!ATTLIST function id NMTOKEN #REQUIRED>

<!ELEMENT description>

<!ELEMENT signature (input*, param*, match*)>
<!ATTLIST signature type (match|format) #REQUIRED>
<!ATTLIST signature locales NMTOKENS #IMPLIED>

<!ELEMENT input EMPTY>
<!ATTLIST input title CDATA #IMPLIED>
<!ATTLIST input type (string|number) #IMPLIED>
<!ATTLIST input values NMTOKENS #IMPLIED>
<!ATTLIST input regex CDATA #IMPLIED>

<!ELEMENT param EMPTY>
<!ATTLIST param name NMTOKEN #REQUIRED>
<!ATTLIST param type (string|number) #IMPLIED>
<!ATTLIST param values NMTOKENS #IMPLIED>
<!ATTLIST param regex CDATA #IMPLIED>
<!ATTLIST param title CDATA #IMPLIED>
<!ATTLIST param required (true|false) "false">
<!ATTLIST param readonly (true|false) "false">

<!ELEMENT match EMPTY>
<!ATTLIST match type (string|number) #IMPLIED>
<!ATTLIST match values NMTOKENS #IMPLIED>
<!ATTLIST match regex CDATA #IMPLIED>
```

The main building block of the registry is the `<function>` element. It represents an implementation of a custom function available to translation at runtime. A function defines a human-readable _description_ of its behavior and one or more _signatures_ of how to call it.

The `<signature>` element defines the calling context of a function with the `type` attribute. A `type="format"` function can only be called inside a placeholder inside translatable text. A `type="match"` function can only be called inside a selector. Signatures with a non-empty `locales` attribute are locale-specific.

A signature may define the type of input it accepts with zero or more `<input>` elments. Note that in MessageFormat 2.0 functions can only ever accept at most one positional argument. Multiple `<input>` elements can be used to define different validation rules for this single argument input, together with appropriate human-readable descriptions.

A signature may also define one or more `<param>` elements representing _named options_ to the function. Parameters are optional by default, unless the `required` attribute is present. They accept either a finite enumeration of values (the `values` attribute) or validate they input with a regular expression (the `regex` attribute). Read-only parameters (the `readonly` attribute) can be displayed to translators in CAT tools, but may not be edited.

Matching-function signatures additionally include one or more `<match>` elements to define the keys against which they're capable of matching.

## Example

The following `registry.xml` is an example of a registry file which may be provided by an implementation to describe its built-in functions. For the sake of brevity, only `locales="en"` is considered.

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE registry SYSTEM "./registry.dtd">

<registry>
    <function id="getPlatform">
        <description>Match the current OS.</description>
        <signature type="match">
            <match type="string" values="windows linux macos android ios"/>
        </signature>
    </function>

    <function id="asNumber">
        <description>
            Format a number. Match a numerical value against CLDR plural categories
            or against a number literal.
        </description>
        <signature type="match" locales="en">
            <input type="number"/>
            <param name="type" type="string" values="cardinal ordinal"/>
            <param name="minimumIntegerDigits" type="number"/>
            <param name="minimumFractionDigits" type="number"/>
            <param name="maximumFractionDigits" type="number"/>
            <param name="minimumSignificantDigits" type="number"/>
            <param name="maximumSignificantDigits" type="number"/>
            <match type="string" values="one other"/>
            <match type="number"/>
        </signature>
        <signature type="format" locales="en">
            <input type="number"/>
            <param name="minimumIntegerDigits" type="number"/>
            <param name="minimumFractionDigits" type="number"/>
            <param name="maximumFractionDigits" type="number"/>
            <param name="minimumSignificantDigits" type="number"/>
            <param name="maximumSignificantDigits" type="number"/>
            <param name="style" readonly="true" type="string" values="decimal currency percent unit"/>
            <param name="currency" readonly="true" type="string" regex="[A-Z]{3}"/>
        </signature>
    </function>
</registry>
```

A localization engineer can then extend the registry by defining the following `customRegistry.xml` file.

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE registry SYSTEM "./registry.dtd">

<registry>
    <function id="asNoun">
        <description>Handle the grammar of a noun.</description>
        <signature type="format" locales="en">
            <input title="Noun id" type="string"/>
            <param name="article" type="string" values="definite indefinite"/>
            <param name="plural" type="string" values="one other"/>
            <param name="case" type="string" values="nominative genitive"/>
        </signature>
    </function>

    <function id="asAdjective">
        <description>Handle the grammar of an adjective.</description>
        <signature type="format" locales="en">
            <input title="Adjective id" type="string"/>
            <param name="article" type="string" values="definite indefinite"/>
            <param name="plural" type="string" values="one other"/>
            <param name="case" type="string" values="nominative genitive"/>
        </signature>
        <signature type="format" locales="en">
            <input title="Adjective id" type="string"/>
            <param name="article" type="string" values="definite indefinite"/>
            <param name="accord"/>
        </signature>
    </function>
</registry>
```

Messages can now use the `asNoun` and the `asAdjective` functions. The following message references the first signature of `asAdjective`, which expects the `plural` and `case` options:

    [You see {$color asAdjective article=indefinite plural=one case=nominative} {$object asNoun case=nominative}!]

The following message references the second signature of `asAdjective`, which only expects the `accord` option:

    $obj = {$object asNoun case=nominative}
    [You see {$color asAdjective article=indefinite accord=$obj} {$obj}!]