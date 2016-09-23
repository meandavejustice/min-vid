# Contributing to the Min Vid  Firefox add-on

Min Vid is part of an effort to experiment in new ways to give the
user more control over media playback on the web. Min Vid aims to let
the user popout a video on in the browser and choose how they want to
view it.

- IRC: `#min-vid` on `irc.mozilla.org`
- Mailing List: [testpilot-dev](https://groups.google.com/a/mozilla.com/d/forum/testpilot-dev)

## Architecture ##

Min Vid is a Firefox add-on.  It uses the Firefox
[Add-on SDK](https://developer.mozilla.org/en-US/Add-ons/SDK) and is
written in JavaScript.  One of the cool things about Min Vid is that
the
[content side of the add-on](https://developer.mozilla.org/en-US/Add-ons/SDK/Guides/Content_Scripts)
is written using [ReactJS](https://facebook.github.io/react/).  This
makes it an awesome project for React hackers to contribute to!

## Finding Bugs, Filing Tickets ##

Min Vid lives on
[GitHub](https://github.com/meandavejustice/min-vid). If you've found
a bug, or have a feature idea that you you'd like to see in Min Vid,
follow these simple guidelines:
- Pick a thoughtful and terse title for the issue (ie. *not* Thing
Doesn't Work!)
- Make sure to mention your Firefox version, OS and basic system
parameters (eg. Firefox 49.0, Windows XP, 512KB RAM)
- If you can reproduce the bug, give a step-by-step recipe
- Include
[stack traces from the console(s)](https://developer.mozilla.org/en-US/docs/Mozilla/Debugging/Debugging_JavaScript)
where appropriate
- Screenshots welcome!
- When in doubt, take a look at some
[existing issues](https://github.com/meandavejustice/min-vid/issues)
and emulate


## Take a Ticket, Hack ##

If you want to write some code, you need to first take a look at the
current [Milestone](#milestones) to get an idea what we are currently
working on. You can then grab a ticket, hack some code, open up a
[Pull Request](#pull-requests), get your code
[reviewed](#code-reviews), and see your code merged into the Min Vid
codebase.

## Milestones ##

All work on Min Vid is broken into two week iterations, which we map
into a GitHub
[Milestone](https://github.com/meandavejustice/min-vid/milestones).
At the beginning of the iteration, we prioritize and estimate tickets
into the milestone, attempting to figure out how much progress we can
make during the iteration.

## Pull Requests ##

You have identified the bug, written code and now want to get it into
the main repo using a
[Pull Request](https://help.github.com/articles/about-pull-requests/).

All code is added using a pull request against the `master` branch of
our repo.  Before submitting a PR, please go through this checklist:
- if your pull request fixes a particular ticket (it does, right?),
please use the `fixes #nnn` github annotation to indicate this
- please add a `PR / Needs review` tag to your PR (if you have
permission).  This starts the code review process.  If you cannot
add a tag, don't worry, we will add it during triage.
- if you can pick a module owner to be your reviewer by including `r?
@username` in the comment (if not, don't worry, we will assign a
reviewer)
- make sure your PR will merge gracefully with `master` at the time
you create the PR, and that your commit history is 'clean'

## Code Reviews ##

You have created a PR and submitted it to the repo, and now are
waiting patiently for you code review feedback.  One of the projects
module owners will be along and will either:
- make suggestions for some improvements
- give you an `R+` in the comments section, indicating the review is
done and the code can be merged

Typically, you will iterate on the PR, making changes and pushing your
changes to new commits on the PR.  When the reviewer is satisfied that
your code is good-to-go, you will get the coveted `R+` comment, and
your code can be merged.  If you have commit permission, you can go
ahead and merge the code to `master`, otherwise, it will be done for
you.

Our project prides itself on it's respectful, patient and positive
attitude when it comes to reviewing contributor's code, and as such,
we expect contributors to be respectful, patient and positive in their
communications as well.  Let's be friends and learn from each other
for a free and awesome, open web!

[Mozilla Committing Rules and Responsibilities](https://developer.mozilla.org/en-US/docs/Mozilla/Developer_guide/Committing_Rules_and_Responsibilities)

## Triage ##

The project team meets weekly (in a closed meeting, for the time
being), to discuss project priorities, to triage new tickets, and to
redistribute the work amongst team members.  Any contributors tickets
or PRs are carefully considered, prioritized, and if needed, assigned
a reviewer.  The project's GitHub
[Milestone page](https://github.com/meandavejustice/min-vid/milestones)
is the best place to look for up-to-date information on project
priorities and current workload.

## Git Commit Guidelines ##

We use our own loose commit guidelines.

The format is basically as follows:

### Subject
The subject contains succinct description of the change:

* use the imperative, present tense: "change" not "changed" nor "changes"
* no dot (.) at the end

### Body
In order to maintain a reference to the context of the commit, add
`fixes #<issue_number>` if it closes a related issue or `issue #<issue_number>`
if it's a partial fix.

You can also write a detailed description of the commit:
Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes"
It should include the motivation for the change and contrast this with previous behavior.

If you have added or removed and dependencies please note them here, along with version number.

A good example commit message can be found
[here](https://github.com/meandavejustice/min-vid/commit/e0b9baf4d1e3ac14e78805ad658c560b5b1ee19d)

## License

[MPL 2.0](https://github.com/meandavejustice/min-vid/blob/master/LICENSE)

