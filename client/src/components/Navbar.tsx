import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { signOut } from "../store/slices/authSlice";
import { setSelectedRepository } from "../store/slices/repositorySlice";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { ChevronDown, Github, LogOut, Settings, User } from "lucide-react";

export function Navbar() {
  const { user } = useAppSelector((state) => state.auth);
  const { repositories, selectedRepository } = useAppSelector(
    (state) => state.repositories
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await dispatch(signOut()).unwrap();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRepositoryChange = (repositoryId: string) => {
    const repository = repositories.find((repo) => repo.id === repositoryId);
    dispatch(setSelectedRepository(repository || null));
  };

  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Github className="h-8 w-8" />
              <span className="text-xl font-bold">Issue Tracker</span>
            </Link>
          </div>

          {/* Repository Selector */}
          <div className="flex-1 max-w-md mx-8">
            {repositories.length > 0 && (
              <div className="w-full">
                <Select
                  value={selectedRepository?.id || ""}
                  onValueChange={handleRepositoryChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a repository">
                      {selectedRepository && (
                        <div className="flex items-center space-x-2">
                          <span className="truncate">
                            {selectedRepository.name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {selectedRepository.full_name.split("/")[0]}
                          </Badge>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {repositories.map((repo) => (
                      <SelectItem key={repo.id} value={repo.id}>
                        <div className="flex items-center space-x-2">
                          <span className="truncate">{repo.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {repo.full_name.split("/")[0]}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Navigation Links and User Menu */}
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>

            {selectedRepository && (
              <Link to="/issues">
                <Button variant="ghost" size="sm">
                  Issues
                </Button>
              </Link>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.email}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled>
                  <User className="mr-2 h-4 w-4" />
                  <span>{user?.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
