#!/bin/bash

export XDG_CACHE_HOME=`mktemp -d`
node $@
