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
		.property("units", &Calculator::units)
		.function("calculateAndPrint", optional_override([](Calculator& self, std::string s, int msecs, EvaluationOptions &eo, PrintOptions &po) {
			return self.calculateAndPrint(s, msecs, eo, po);
		}));

	class_<Unit>("Unit")
		.function("abbreviation", optional_override([](Unit &self) {
			return (self.abbreviation());
		}));
	
	register_vector<Unit*>("vector<Unit*>");

	class_<EvaluationOptions>("EvaluationOptions")
		.property("approximation", &EvaluationOptions::approximation);
	
	enum_<ApproximationMode>("ApproximationMode")
		.value("EXACT", APPROXIMATION_EXACT)
		.value("TRY_EXACT", APPROXIMATION_TRY_EXACT)
		.value("APPROXIMATE", APPROXIMATION_APPROXIMATE)
		.value("EXACT_VARIABLES", APPROXIMATION_EXACT_VARIABLES);

	constant("default_user_evaluation_options", default_user_evaluation_options);

	class_<PrintOptions>("PrintOptions")
		.property("interval_display", &PrintOptions::interval_display);
	
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

}