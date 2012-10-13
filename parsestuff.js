// Setup Parse
Parse.initialize("0vkAZmA6fG72LcEdrdhSFSGwak929wuNg7pYUnS3", "ajpyz4W4mSH1xqUqMuz8fZfuEwgtER9Aj7jSC8k1");

function Authentication($scope) {
    $scope.register = function() {
        
        var user = new Parse.User();
        user.set("username", $scope.register.username);
        user.set("password", $scope.register.password);
        user.set("email",    $scope.register.email);
        
        user.signUp(null, {
            success: function(user) {
                $scope.$apply(function() {
                    $scope.updateUser();
                });
            },
            error: function(user,error) {
                alert ("Error: " + error.code + " " + error.message);
            }
        });
        
    }
    
    $scope.login = function() {
        
        Parse.User.logIn($scope.login.username, $scope.login.password, {
            success: function(user) {
                $scope.$apply(function() {
                    $scope.updateUser();
                });
            },
            error: function(user, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
        
    }
}

function Global($scope) {
    
    $scope.currentUser = Parse.User.current();
    
    $scope.updateUser = function() {
        $scope.currentUser = Parse.User.current();
    }
    
    $scope.logout = function() {
        Parse.User.logOut();
        $scope.updateUser()
    }
    
}

