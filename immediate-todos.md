# Token indication on ui that reread of all tokens has happened to detect cache leaks

Agents going more than an hour while a sub agent works long will trigger the parent to reread everything, instead of
looking at cahce, cause of expires. We need to see when this happens in the ui

# Set the cache for agents/subagents to 1hr

## 2ndary

- This leads to the question of, are harnesses viable from anthropic and google anymore? I have an orchastrator that
  handles the churn much better (though Ill have to add wake up signals to instances to keep the cache alive)

# Need right side of execution panel to have stats

- Failed tool calls and amount
- Huge context changes
- other metrics to identify issues
- Would be nice to have a transcript timeline grouping and time churned on various phases to identify slowdowns
- Need to start tracking work churn metrics across quests to start building a baseline. Thought this complicates cause
  work can be different sizes.

# Add google models to being able to send workers to do stuff

Even if I solve the claude usage issues, Im gonna wanna scale on projects so Im gonna need more models across diff
accounts.

This means transcript parsing and streaming.

# Look into local models and what it would take

Solving for usage issues, down and dirty operations might be handleable by local models at this point. Curious if the
arch holds up.
Qwin 3.8B or 27B or Bonsai 2 27B.

Need this for image processing anyway for one project.

scrolls/hardware-spec-local-inference-server.md

# Dungeonmaster is gonna need a generic chatter for quick fixes

Im having to reach for harnesses for quick fixes cause I know I dont need a full quest. I need either a third quest type
or
I need chaoswhisper to choose a playbook depending on user request.

# Flow graphs are gonna need a simplier starter to make them easier to consume and then figure out if observables are too granular or if we need user observables and then llm observables.

Theyre already feeling granular which is annoying. Figure out what I care about vs not.

# Need to lock down dungeonmaster, publish it so I can churn on other projects.

I cant solve testing if Im continuously optimizing dungeonmaster. I need to find a godo enough state and optimize in
tandum.
Granted these limit changes threw another wrench in my workflow.

# I really need the "Idea tracker" Thing built

Im having to doc this in a random file and Id like to be able to just sic agents on exploratory for several immediately
This means Im gonna need to allow parallelizing or at least, parallelizing in chats.
Having a project manager type figure wouldnt be a bad thing either

# Agents need to be able to signal "was there anything that made you slow or code you noticed is janky?"

This can then be filed as followups to automatically cleanup code

# The sub agent view is pretty crowded and granular in dungeonmaster

Need to look at making it a bit more reader friendly

# I want animations as quest is going

Thatd make the ui ideal to use

# Dungeonmaster should switch to launching electron

So I dont have to have a browser tab

# Dungeonmaster quest queue is janky.

When I start up the server, queue is rightfully paused. I probbably just need to unpause After I switch to electron.

# Dungeonmaster needs to list active token usgae and limits

Any models I use, I need an active display of what my 5h/7d token usage is in the ui. For all models I wanna use
This then lets me have dungeonmaster pick models based on current usage and leverage them

# Dungeonmaster needs to keep track of transaction jsons that have props not known

I keep running into this where anthropic is changing their transcript jsons and its leading to bugs.
As dungeonmaster reads transcript lines, any it runs into that arent in our lexicon need to be notated as a followup
task to fix.
Or maybe we look at the version changes in harnesses for types.

# Streaming from transcript folders is still wonky

Because worktree transcripts get created on the fly, dungeonmaster has a really bad lag watching them.

# I really wanna build my rss feed so I can stop going to shit like reddit and blusky and filter out what I dont care about.

Im tired of reading nonsense on internet. Its a waste of time
