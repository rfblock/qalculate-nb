#include <libqalculate/qalculate.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>

using namespace emscripten;

Calculator* getCalculator() {
    // there's only one global calculator, and you're not supposed to call
    // the Calculator constructor after it's initialized
    if (CALCULATOR == nullptr) {
        new Calculator();
    }
    return CALCULATOR;
}

std::string qalc_gnuplot_data_dir() {
    return "";
}
bool qalc_invoke_gnuplot(
    std::vector<std::pair<std::string, std::string>> data_files,
    std::string commands, std::string extra, bool persist) {
    val data_obj = val::object();
    for (auto file : data_files) {
        data_obj.set(file.first, file.second);
    }
    return val::global("runGnuplot").call<bool>("call", val::undefined(), data_obj, commands, extra, persist);
}

typedef decltype(UNICODE_SIGNS_WITHOUT_EXPONENTS) UnicodeSigns;

EMSCRIPTEN_BINDINGS(calculator_bindings) {
	class_<Calculator>("Calculator")
		.constructor(&getCalculator, allow_raw_pointers())
		.function("reset", &Calculator::reset)
		.function("loadGlobalDefinitions", select_overload<bool()>(&Calculator::loadGlobalDefinitions))
		.function("message", select_overload<CalculatorMessage*()>(&Calculator::message), allow_raw_pointers())
		.function("nextMessage", &Calculator::nextMessage, allow_raw_pointers())
		.property("units", &Calculator::units)
		.property("variables", &Calculator::variables)
		.function("calculateAndPrint", optional_override([](Calculator& self, std::string s, int msecs, EvaluationOptions &eo, PrintOptions &po) {
			return self.calculateAndPrint(s, msecs, eo, po);
		}))
		.function("calculate", optional_override([](Calculator& self, std::string s, EvaluationOptions &eo) {
			return self.calculate(s, eo);
		}))
		.function("parse", optional_override([](Calculator &self, std::string s) {
			return self.parse(s);
		}));

	class_<Unit>("Unit")
		.function("abbreviation", optional_override([](Unit &self) {
			return self.abbreviation();
		}));
	
	register_vector<Unit*>("vector<Unit*>");

	class_<KnownVariable, base<Variable>>("KnownVariable")
		.function("get", &KnownVariable::get);

	class_<Variable, base<ExpressionItem>>("Variable")
		.function("isKnown", &Variable::isKnown)
		.function("toKnownVariable", optional_override([](Variable &self) {
			return (KnownVariable*) &self;
		}), allow_raw_pointers());

	register_vector<Variable*>("vector<Variable*>");
		
	class_<ExpressionItem>("ExpressionItem")
		.function("isLocal", &ExpressionItem::isLocal)
		.function("name", optional_override([](ExpressionItem &self) {
			return self.name(true);
		}));

	class_<MathStructure>("MathStructure")
		.function("type", &MathStructure::type)
		.function("getChild", select_overload<MathStructure *(size_t)>(&MathStructure::getChild), allow_raw_pointers())
		.function("countChildren", &MathStructure::countChildren)
		.function("format", &MathStructure::format)
		.function("getFunctionName", optional_override([](MathStructure &self) {
			return self.function()->name();
		}))
		.function("variable", &MathStructure::variable, allow_raw_pointers())
		.function("rows", &MathStructure::rows)
		.function("columns", &MathStructure::columns)
		.function("print", optional_override([](MathStructure &self, PrintOptions &po) {
			return self.print(po);
		}));

	enum_<StructureType>("StructureType")
		.value("MULTIPLICATION", STRUCT_MULTIPLICATION)
		.value("INVERSE", STRUCT_INVERSE)
		.value("DIVISION", STRUCT_DIVISION)
		.value("ADDITION", STRUCT_ADDITION)
		.value("NEGATE", STRUCT_NEGATE)
		.value("POWER", STRUCT_POWER)
		.value("NUMBER", STRUCT_NUMBER)
		.value("UNIT", STRUCT_UNIT)
		.value("SYMBOLIC", STRUCT_SYMBOLIC)
		.value("FUNCTION", STRUCT_FUNCTION)
		.value("VARIABLE", STRUCT_VARIABLE)
		.value("VECTOR", STRUCT_VECTOR)
		.value("BITWISE_AND", STRUCT_BITWISE_AND)
		.value("BITWISE_OR", STRUCT_BITWISE_OR)
		.value("BITWISE_XOR", STRUCT_BITWISE_XOR)
		.value("BITWISE_NOT", STRUCT_BITWISE_NOT)
		.value("LOGICAL_AND", STRUCT_LOGICAL_AND)
		.value("LOGICAL_OR", STRUCT_LOGICAL_OR)
		.value("LOGICAL_XOR", STRUCT_LOGICAL_XOR)
		.value("LOGICAL_NOT", STRUCT_LOGICAL_NOT)
		.value("COMPARISON", STRUCT_COMPARISON)
		.value("UNDEFINED", STRUCT_UNDEFINED)
		.value("ABORTED", STRUCT_ABORTED)
		.value("DATETIME", STRUCT_DATETIME);

	class_<EvaluationOptions>("EvaluationOptions")
		.property("approximation", &EvaluationOptions::approximation);
	
	enum_<ApproximationMode>("ApproximationMode")
		.value("EXACT", APPROXIMATION_EXACT)
		.value("TRY_EXACT", APPROXIMATION_TRY_EXACT)
		.value("APPROXIMATE", APPROXIMATION_APPROXIMATE)
		.value("EXACT_VARIABLES", APPROXIMATION_EXACT_VARIABLES);

	constant("default_user_evaluation_options", default_user_evaluation_options);

	class_<PrintOptions>("PrintOptions")
		.property("interval_display", &PrintOptions::interval_display)
		.property("spell_out_logical_operators", &PrintOptions::spell_out_logical_operators)
		.property("spacious", &PrintOptions::spacious)
		.property("excessive_parenthesis", &PrintOptions::excessive_parenthesis)
		.property("limit_implicit_multiplication", &PrintOptions::limit_implicit_multiplication)
		.property("short_multiplication", &PrintOptions::short_multiplication)
		.property("use_unicode_signs", &PrintOptions::use_unicode_signs);
	
	constant("default_print_options", default_print_options);

	enum_<IntervalDisplay>("IntervalDisplay")
		.value("SIGNIFICANT_DIGITS", INTERVAL_DISPLAY_SIGNIFICANT_DIGITS)
		.value("INTERVAL", INTERVAL_DISPLAY_INTERVAL)
		.value("PLUSMINUS", INTERVAL_DISPLAY_PLUSMINUS)
		.value("MIDPOINT", INTERVAL_DISPLAY_MIDPOINT)
		.value("LOWER", INTERVAL_DISPLAY_LOWER)
		.value("UPPER", INTERVAL_DISPLAY_UPPER)
		.value("CONCISE", INTERVAL_DISPLAY_CONCISE)
		.value("RELATIVE", INTERVAL_DISPLAY_RELATIVE);

	enum_<UnicodeSigns>("UNICODE_SIGNS")
		.value("OFF", UNICODE_SIGNS_OFF)
		.value("ON", UNICODE_SIGNS_ON)
		.value("ONLY_UNIT_EXPONENTS", UNICODE_SIGNS_ONLY_UNIT_EXPONENTS)
		.value("WITHOUT_EXPONENTS", UNICODE_SIGNS_WITHOUT_EXPONENTS);

	class_<CalculatorMessage>("CalculatorMessage")
		.function("message", &CalculatorMessage::message)
		.function("type", &CalculatorMessage::type);

	enum_<MessageType>("MessageType")
		.value("INFORMATION", MESSAGE_INFORMATION)
		.value("WARNING", MESSAGE_WARNING)
		.value("ERROR", MESSAGE_ERROR);
}