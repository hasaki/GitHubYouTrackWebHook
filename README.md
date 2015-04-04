# GitHubYouTrackWebHook [![Build Status](https://secure.travis-ci.org/hasaki/GitHubYouTrackWebHook.png?branch=master)](http://travis-ci.org/hasaki/GitHubYouTrackWebHook)

A configurable node-based server to respond to GitHub webhook requests for pushes and pull requests. If certain conditions are met, the hook will then update cases in a YouTrack system.

Based on the original [YouTrack service](https://github.com/github/github-services/blob/master/lib/services/you_track.rb) code, but updated and ported to node.js

## Why?

The current GitHub YouTrack service doesn't support several features that we were interested in having:

1. You have to allow all branches or hardcode the names of the specific branches you want the service to watch.
    In our normal work flow there are two different locations we will branch from and merge to.  For simple cases, we'll branch right off of master and submit a pull request to merge back to master. 
    For complex cases that need to be broken down into multiple cases, we'll create a branch from master, our "feature" branch.  Then all of the work takes place in branches off of the "feature" and are merged back into the "feature" branch.  Once its completely done, we'll merge that whole feature into master.
    The current service doesn't give us the capability of saying "watch all branches starting with `feature/`" (oddly, TeamCity, also made by JetBrains allows this).
2. You cannot watch a repository for multiple projects.
    This is an issue for multiple scenarios. The biggest one is that we have a shared library that we use in multiple projects and changes to it can come from each of them, so we need the ability to have this single repo used in multiple projects.
    Also, as our company has grown we're beginning to need to use different methods of accepting contributions from our team members.  We're moving from a single monolithic repository that everyone works from to having our team members fork the repo and do their work inside of the forks.