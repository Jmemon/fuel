

Event queues integrated apps write to

Stored in ~/.fuel/events

Could use:
 - directory-based queue
 - redis
 - sql table as a queue

I'm not familiar with this sort of thing, so will need to think it out.

For one thing, we are installing hooks on app side, so the queue needs to be able to be written to whether fuel is open or not. And when fuel is open, if we put the events in their own service they would need ot be mapped to whatever file they write to. Or if we wrapped it into a different service same.

In addition, we should think about scaling to network calls. This only works for apps that I am using. Since if my computer is off none of this works. Claude code and git work for this because they do things when I'm using them. But if I add other apps this might not work as well.

Maybe this works for local events and I include a different entity for remote events, lightweight server.




But whatever we choose, we will have to have our git hooks and our claude code hooks writing to this event queue.

