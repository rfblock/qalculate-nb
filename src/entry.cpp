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
			return self.name();
		}));

	class_<MathStructure>("MathStructure")
		.function("print", optional_override([](MathStructure &self, PrintOptions &po) {
			return self.print(po);
		}));

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
		.property("spell_out_logical_operators", &PrintOptions::spell_out_logical_operators);
	
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


	class_<CalculatorMessage>("CalculatorMessage")
		.function("message", &CalculatorMessage::message)
		.function("type", &CalculatorMessage::type);

	enum_<MessageType>("MessageType")
		.value("INFORMATION", MESSAGE_INFORMATION)
		.value("WARNING", MESSAGE_WARNING)
		.value("ERROR", MESSAGE_ERROR);
}