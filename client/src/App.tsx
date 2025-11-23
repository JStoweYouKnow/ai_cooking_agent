import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Layout } from "./components/Layout";
import { lazy, Suspense } from "react";
import { RecipeCardSkeleton } from "@/components/RecipeCardSkeleton";

// Code splitting: Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.default })));
const IngredientsPage = lazy(() => import("./pages/IngredientsPage").then(m => ({ default: m.default })));
const RecipeSearchPage = lazy(() => import("./pages/RecipeSearchPage").then(m => ({ default: m.default })));
const CreateRecipePage = lazy(() => import("./pages/CreateRecipePage").then(m => ({ default: m.default })));
const RecipeDetailPage = lazy(() => import("./pages/RecipeDetailPage").then(m => ({ default: m.default })));
const ShoppingListsPage = lazy(() => import("./pages/ShoppingListsPage").then(m => ({ default: m.default })));
const MessagesPage = lazy(() => import("./pages/MessagesPage").then(m => ({ default: m.default })));
const NotFound = lazy(() => import("./pages/NotFound").then(m => ({ default: m.default })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pc-olive mx-auto mb-4"></div>
      <p className="text-pc-text-light">Loading...</p>
    </div>
  </div>
);

function Router() {
	return (
		<Suspense fallback={<PageLoader />}>
			<Switch>
				<Route path="/">
					{() => (
						<Layout>
							<Suspense fallback={<PageLoader />}>
								<Dashboard />
							</Suspense>
						</Layout>
					)}
				</Route>
				<Route path="/ingredients">
					{() => (
						<Layout>
							<Suspense fallback={<PageLoader />}>
								<IngredientsPage />
							</Suspense>
						</Layout>
					)}
				</Route>
				<Route path="/recipes">
					{() => (
						<Layout>
							<Suspense fallback={<PageLoader />}>
								<RecipeSearchPage />
							</Suspense>
						</Layout>
					)}
				</Route>
				<Route path="/recipes/create">
					{() => (
						<Layout>
							<Suspense fallback={<PageLoader />}>
								<CreateRecipePage />
							</Suspense>
						</Layout>
					)}
				</Route>
				<Route path="/recipes/:id">
					{() => (
						<Layout>
							<Suspense fallback={<PageLoader />}>
								<RecipeDetailPage />
							</Suspense>
						</Layout>
					)}
				</Route>
				<Route path="/shopping-lists">
					{() => (
						<Layout>
							<Suspense fallback={<PageLoader />}>
								<ShoppingListsPage />
							</Suspense>
						</Layout>
					)}
				</Route>
				<Route path="/messages">
					{() => (
						<Layout>
							<Suspense fallback={<PageLoader />}>
								<MessagesPage />
							</Suspense>
						</Layout>
					)}
				</Route>
				<Route path="/404">
					{() => (
						<Layout>
							<Suspense fallback={<PageLoader />}>
								<NotFound />
							</Suspense>
						</Layout>
					)}
				</Route>
				{/* Final fallback route */}
				<Route>
					{() => (
						<Layout>
							<Suspense fallback={<PageLoader />}>
								<NotFound />
							</Suspense>
						</Layout>
					)}
				</Route>
			</Switch>
		</Suspense>
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
					<Toaster />
					<Router />
				</TooltipProvider>
			</ThemeProvider>
		</ErrorBoundary>
	);
}

export default App;
