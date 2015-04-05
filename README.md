# GitHubYouTrackWebHook [![Build Status](https://secure.travis-ci.org/hasaki/GitHubYouTrackWebHook.png?branch=master)](http://travis-ci.org/hasaki/GitHubYouTrackWebHook)

A configurable node-based server to respond to GitHub webhook requests for pushes and pull requests. If certain conditions are met, the hook will then update cases in a YouTrack system.

Based on the original [YouTrack service](https://github.com/github/github-services/blob/master/lib/services/you_track.rb) code, but updated and ported to node.js

## Why?

The current GitHub YouTrack service doesn't support several features that we were interested in having:

1. You have to allow all branches or hardcode the names of the specific branches you want the service to watch. The current service doesn't give us the capability of saying "watch all branches starting with `feature/`" (oddly, TeamCity, also made by JetBrains allows this).
2. You cannot watch a repository for multiple projects. This is more of an issue for the YouTrack UI, because as far as I can tell all of the code is actually working in the system.

## Configuration

Take a look at `config.json.example`; this sample file lays out all of settings available; place your settings in `config.json`.

Run with the following command line: `node server.js [SHAREDSECRET]`

`SHAREDSECRET` is a simple text string that you will configure on this server as well as in github.  If this isn't provided then it falls back to using an environment variable named `GITHUBYOUTRACKSECRET`.

The hook will listen on port 1337 or whatever is defined by the environment variable named `port`.

When configuring github, point it at the node server and make sure your path ends in `/webhook`.

## How it works

The server waits for requests from the GitHub servers and singles out requests for the `push` and `pull_request` events.  It then will perform a series of comparisons to check and see whether it should process the event looking for commands to run on YouTrack cases.

### What sorts of checks does it do?

In no particular order for commits to branches:

* Check that there is one or more commands in the commit message (that is the text "#ISSUE-ID *command1* *command2* *etc*" if you want to run commands against multiple issues you must put them on separate lines)
* Check that the incoming repository is allowed
* Check that the incoming branch is allowed for that repo
* Check that the project for the command is allowed for that repo
* Check that the user issuing the command is allowed for that project

For pull requests:

* The PR has been closed and was merged
* That there is one or more commands in the body of the PR (that is the large textbox that you can populate when you create the pull request)

