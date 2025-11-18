import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import IngredientsPage from "./pages/IngredientsPage";
import RecipeSearchPage from "./pages/RecipeSearchPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import ShoppingListsPage from "./pages/ShoppingListsPage";

function Router() {
	return (
		<Switch>
			<Route path="/">
				{() => <Dashboard />}
			</Route>
			<Route path="/ingredients">
				{() => <IngredientsPage />}
			</Route>
			<Route path="/recipes">
				{() => <RecipeSearchPage />}
			</Route>
			<Route path="/recipes/:id">
				{() => <RecipeDetailPage />}
			</Route>
			<Route path="/shopping-lists">
				{() => <ShoppingListsPage />}
			</Route>
			<Route path="/404" component={NotFound} />
			{/* Final fallback route */}
			<Route component={NotFound} />
		</Switch>
	);
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
	return (
		<ErrorBoundary>
			<ThemeProvider defaultTheme="light">
				<TooltipProvider>
					<Layout>
						<Toaster />
						<Router />
					</Layout>
				</TooltipProvider>
			</ThemeProvider>
		</ErrorBoundary>
	);
}

export default App;
