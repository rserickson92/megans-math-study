indent = '  '
answer_blank = '__'

problems = File.read(ARGV[0])
problem_json = "[\n"
problems.split("\n").each_with_object(problem_json) do |line, json|
  json << "#{indent}{\n"
  json << "#{indent*2}equation: `\n"

  line_tokens = line.split(/(#{answer_blank})/)
  line_tokens.each do |token|
    case token
    when answer_blank
      json << "#{indent*3}${answerBox()}\n"
    else
      json << "#{indent*3}${equationSegment('#{token}')}\n"
    end
  end

  json << "#{indent*2}`,\n"
  json << "#{indent*2}correctResponse: REPLACE_ME,\n"

  json << "#{indent}},\n"
end

problem_json << "];\n"

puts problem_json