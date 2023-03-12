#!/bin/zsh

curl --url 'https://inducks.org/inducks/isv.tgz' -o './isv.tgz';

if [ -d "./isv" ]
then
  mv ./isv ./isv-old
fi

tar -xzvf ./isv.tgz
